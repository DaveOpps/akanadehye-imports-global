/**
 * Claude-powered bot brain.
 *
 * Wraps Anthropic's Messages API + tool runner so the bot can actually
 * understand customer messages, search the catalog intelligently, and respect
 * the merchant's persona/tone — instead of falling back to keyword matching.
 *
 * Used by /api/bots/test, /api/bots/telegram, /api/bots/whatsapp. Falls back to
 * the legacy pattern-matching brain in `./botBrain` if ANTHROPIC_API_KEY is
 * missing or any call fails, so the bot never breaks for end users.
 *
 * Defaults follow the claude-api skill: claude-opus-4-8 + adaptive thinking,
 * no sampling params, max_tokens kept comfortably under HTTP-timeout thresholds.
 */

import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { getProducts } from "./shop-products";
import { formatPrice } from "./products";
import { UMBRELLA_CATEGORIES } from "./storefront-categories";
import { reply as fallbackReply, type BotReply, type Persona } from "./botBrain";
import { prisma } from "./db";

export type ConversationMsg = {
  role: "user" | "assistant";
  content: string;
};

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";
const MAX_HISTORY = 12; // last N turns sent to Claude — caps token spend
const MAX_TOKENS = 4096; // bot replies are short; well under timeout limits

// ---------- Tools ----------

const listCategoriesTool = betaZodTool({
  name: "list_categories",
  description:
    "List the product categories/departments available in the shop. " +
    "Call this when the customer asks 'what do you sell', 'what categories', " +
    "'what departments', or otherwise wants to browse without a specific item in mind.",
  inputSchema: z.object({}),
  run: async () => {
    const cats = UMBRELLA_CATEGORIES.map((u) => ({
      label: u.label,
      slug: u.primarySlug,
      description: u.blurb ?? "",
      subcategories: u.groups
        .flatMap((g) => g.items.map((i) => ({ name: i.label, slug: i.slug })))
        .slice(0, 6),
    }));
    return JSON.stringify({ total: cats.length, categories: cats });
  },
});

const searchProductsTool = betaZodTool({
  name: "search_products",
  description:
    "Search the product catalog. Call this whenever the customer mentions a specific product " +
    "(e.g. 'iPhone', 'perfume'), asks for prices/stock of something, or wants to see what's in a category. " +
    "If you have a category slug from list_categories, pass it as `category`; otherwise use `query` for free-text search.",
  inputSchema: z.object({
    query: z.string().optional().describe("Free-text search query (e.g. 'iPhone', 'lipstick')"),
    category: z
      .string()
      .optional()
      .describe("Category slug from list_categories (e.g. 'smartphones', 'fragrances')"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(8)
      .default(5)
      .describe("Max number of products to return"),
  }),
  run: async ({ query, category, limit }) => {
    try {
      const { products, total } = await getProducts({ q: query, category, limit });
      if (products.length === 0) {
        return JSON.stringify({ found: 0, products: [] });
      }
      return JSON.stringify({
        found: total,
        showing: products.length,
        products: products.map((p) => ({
          id: p.id,
          title: p.title,
          brand: p.brand,
          category: p.category,
          price: formatPrice(p.price),
          discount_percent: p.discountPercentage,
          rating: p.rating,
          stock: p.stock,
          description: p.description.slice(0, 160),
        })),
      });
    } catch (err) {
      return JSON.stringify({ error: (err as Error).message });
    }
  },
});

const searchMerchantInventoryTool = betaZodTool({
  name: "search_merchant_inventory",
  description:
    "Search the merchant's own in-stock inventory stored in the database. " +
    "Use this FIRST before search_products when a customer asks about product availability, prices, or stock. " +
    "Merchant products are real stock the store carries — always prefer these over catalog results.",
  inputSchema: z.object({
    query: z.string().optional().describe("Product name or keyword (e.g. 'earbuds', 'serum')"),
    category: z.string().optional().describe("Category name (e.g. 'Electronics', 'Beauty')"),
    limit: z.number().int().min(1).max(10).default(5),
  }),
  run: async ({ query, category, limit }) => {
    try {
      const q = query?.toLowerCase() ?? "";
      const items = await prisma.inventoryItem.findMany({
        where: {
          ...(category ? { category: { contains: category } } : {}),
          ...(q ? {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } },
              { tags: { contains: q } },
              { category: { contains: q } },
            ],
          } : {}),
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
      });

      if (items.length === 0) {
        return JSON.stringify({ found: 0, items: [], note: "No merchant stock found for this query." });
      }

      return JSON.stringify({
        found: items.length,
        source: "merchant_inventory",
        items: items.map((i) => ({
          id: i.id,
          sku: i.sku,
          name: i.name,
          category: i.category,
          price: `GHS ${i.price.toFixed(2)}`,
          salePrice: i.salePrice ? `GHS ${i.salePrice.toFixed(2)}` : null,
          stock: i.stock,
          status: i.stock === 0 ? "out-of-stock" : i.stock <= i.reorderAt ? "low-stock" : "in-stock",
          description: i.description?.slice(0, 200) ?? null,
          tags: i.tags ? JSON.parse(i.tags) : [],
        })),
      });
    } catch (err) {
      return JSON.stringify({ error: (err as Error).message });
    }
  },
});

const escalateToHumanTool = betaZodTool({
  name: "escalate_to_human",
  description:
    "Mark this conversation as needing a human reply. Call this when the customer asks to speak " +
    "to a person, an agent, support, a manager, or expresses frustration that you can't resolve.",
  inputSchema: z.object({
    reason: z.string().describe("Brief reason this needs a human (1 sentence)"),
  }),
  run: async ({ reason }) => {
    return JSON.stringify({ escalated: true, reason });
  },
});

const tools = [listCategoriesTool, searchMerchantInventoryTool, searchProductsTool, escalateToHumanTool];

// ---------- System prompt ----------

function buildSystemPrompt(persona: Required<Persona>): string {
  const toneGuidance: Record<Persona["tone"] & string, string> = {
    formal:
      "Use a polite, professional register. Avoid contractions, slang, and emoji. Address the customer respectfully.",
    friendly:
      "Use a warm, conversational tone. Light contractions are fine. The occasional emoji (like 👋 or 🛍️) is welcome, but don't overdo it.",
    casual:
      "Use a relaxed, modern tone. Contractions, friendly emoji, and short sentences are encouraged.",
  };

  const categoryMap = UMBRELLA_CATEGORIES.map(
    (u) =>
      `• ${u.label} (slug: ${u.primarySlug})${u.blurb ? ` — ${u.blurb}` : ""}\n` +
      u.groups
        .map((g) => `  ${g.title}: ${g.items.map((i) => i.label).join(", ")}`)
        .join("\n")
  ).join("\n");

  return [
    `You are the customer service bot for ${persona.shopName}, a Ghana-based ecommerce store carrying hundreds of products across 12 departments.`,
    "",
    "## Store departments",
    "Here is the complete category structure — use slugs when calling search_products:",
    categoryMap,
    "",
    "## Your persona",
    `Tone: ${persona.tone} — ${toneGuidance[persona.tone]}`,
    `Business hours: ${persona.hours}`,
    `Contact phone: ${persona.contactPhone}`,
    `Contact email: ${persona.contactEmail}`,
    "",
    "## Your job",
    "Help customers find products, quote prices and stock, share business hours and contact info, and hand off to a human when asked.",
    "",
    "## When to call tools",
    "- `list_categories` — the customer wants to browse but hasn't named a product/category.",
    "- `search_merchant_inventory` — FIRST choice when a customer asks about a specific product, price, or stock. These are real products the merchant stocks. Always try this before search_products.",
    "- `search_products` — fallback catalog search (DummyJSON) when merchant inventory has no match. Also use when browsing by category slug.",
    "- `escalate_to_human` — the customer says 'agent', 'human', 'support', 'talk to someone', or expresses frustration.",
    "",
    "## Response rules",
    "- Keep replies under 6 sentences unless you're listing products.",
    "- When listing products, format each line as: `1. Title — Price · ★Rating · Nstock`.",
    "- Don't promise specific delivery times — say 'we'll confirm at checkout' instead.",
    "- Don't process payments or take card numbers — direct customers to the website to check out.",
    "- If a customer asks about something you can't verify with a tool, say you'd like to connect them to a human and call `escalate_to_human`.",
    "- If the catalog has no match, suggest a related category or call `list_categories`.",
    "",
    "## Greeting",
    `On first contact (the customer says 'hi', 'hello', or similar with no other content), use this greeting verbatim: "${persona.greeting}"`,
    "Then offer 2-3 example questions they could ask.",
  ].join("\n");
}

// ---------- Main entry ----------

/**
 * Reply with Claude. Falls back to pattern-matching brain on any error.
 */
export async function replyWithClaude(
  message: string,
  persona: Required<Persona>,
  history: ConversationMsg[] = []
): Promise<BotReply> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return fallbackReply(message, persona);
  }

  try {
    const client = new Anthropic({ apiKey });

    // Cap history to avoid runaway token usage
    const trimmed = history.slice(-MAX_HISTORY);
    const messages: Anthropic.Beta.BetaMessageParam[] = [
      ...trimmed.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const finalMessage = await client.beta.messages.toolRunner({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: buildSystemPrompt(persona),
      tools,
      messages,
    });

    // Extract text + suggestions from the final assistant message
    const textBlocks = finalMessage.content.filter(
      (b): b is Anthropic.Beta.BetaTextBlock => b.type === "text"
    );
    const text = textBlocks.map((b) => b.text).join("\n\n").trim();

    if (!text) {
      // Empty response — fall back
      return fallbackReply(message, persona);
    }

    return { text };
  } catch (err) {
    // Log for visibility but never break the bot
    // eslint-disable-next-line no-console
    console.error("[claudeBot] reply failed, falling back to pattern matching:", err);
    return fallbackReply(message, persona);
  }
}

/**
 * Quick helper used by /api/bots/status to surface whether Claude is wired up.
 */
export function claudeStatus(): { configured: boolean; model: string | null } {
  const configured = (process.env.ANTHROPIC_API_KEY ?? "").length > 10;
  return { configured, model: configured ? MODEL : null };
}
