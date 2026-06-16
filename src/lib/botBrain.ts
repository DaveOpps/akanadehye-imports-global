// Bot brain: takes a customer message, returns a reply.
// Pure function (no localStorage), so it works in both browser test panel and server webhooks.

import { getProducts } from "./shop-products";
import { formatPrice, type Product } from "./products";
import { UMBRELLA_CATEGORIES } from "./storefront-categories";
import { prisma } from "./db";

export type BotReply = {
  text: string;
  // Optional structured payload for richer renderers (Telegram inline keyboards, etc.)
  suggestions?: string[];
};

/**
 * Optional persona that customises greeting + contact replies.
 * Test endpoint forwards the merchant's saved persona; server webhooks fall back
 * to defaults (later: read from DB once auth + DB land in Sprint 1).
 */
export type Persona = {
  shopName?: string;
  greeting?: string;
  hours?: string;
  contactPhone?: string;
  contactEmail?: string;
  tone?: "formal" | "friendly" | "casual";
};

const DEFAULT_PERSONA: Required<Persona> = {
  shopName: "Akanadehye",
  greeting: "👋 Welcome to Akanadehye! I can help you find products.",
  hours: "Mon–Sat 8am–8pm GMT",
  contactPhone: "+233 50 000 0000",
  contactEmail: "hello@akanadehye.com",
  tone: "friendly",
};

function resolve(p?: Persona): Required<Persona> {
  return { ...DEFAULT_PERSONA, ...(p ?? {}) };
}

const GREETINGS = ["hi", "hello", "hey", "yo", "good morning", "good afternoon", "good evening", "ete sen", "akwaaba"];
const HELP_WORDS = ["help", "menu", "options", "start", "what can you do"];
const CATEGORY_WORDS = ["category", "categories", "department", "departments", "section"];
const ALL_WORDS = ["all", "everything", "catalog", "catalogue", "all products"];
const PRICE_WORDS = ["price", "cost", "how much"];
const STOCK_WORDS = ["available", "in stock", "stock", "have", "got any"];
const CONTACT_WORDS = ["human", "agent", "support", "talk to someone", "representative", "call"];
const HOURS_WORDS = ["hours", "open", "closing time", "when are you open"];
const CONTACT_INFO_WORDS = ["email", "phone number", "your number", "phone"];

const SHOP_URL = "https://akanadehye.vercel.app/products";

function norm(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();
}

function any(text: string, list: string[]): boolean {
  return list.some((w) => text.includes(w));
}

function welcome(persona: Required<Persona>): BotReply {
  const sign = persona.tone === "formal" ? "Greetings." : persona.tone === "casual" ? "Hey! 👋" : "";
  const intro = sign ? `${sign} ${persona.greeting}` : persona.greeting;
  return {
    text:
      `${intro}\n\n` +
      "Try asking:\n" +
      "• \"What categories do you have?\"\n" +
      "• \"Show me smartphones\"\n" +
      "• \"Price of iPhone\"\n" +
      "• \"Do you have perfumes?\"\n\n" +
      "Type \"agent\" to talk to a human.",
    suggestions: ["Show categories", "Best sellers", "Talk to agent"],
  };
}

function formatProductLine(p: Product, idx?: number): string {
  const tag = idx != null ? `${idx + 1}. ` : "";
  const discounted = p.discountPercentage > 0 ? p.price * (1 - p.discountPercentage / 100) : p.price;
  const priceStr =
    p.discountPercentage > 0
      ? `${formatPrice(discounted)} (was ${formatPrice(p.price)}, -${Math.round(p.discountPercentage)}%)`
      : formatPrice(p.price);
  return `${tag}${p.title}\n   ${priceStr} · ★ ${p.rating.toFixed(1)} · ${p.stock} in stock`;
}

async function listCategoriesReply(persona: Required<Persona>): Promise<BotReply> {
  const lines = UMBRELLA_CATEGORIES.map(
    (u, i) => `${i + 1}. ${u.label}${u.blurb ? ` — ${u.blurb}` : ""}`
  ).join("\n");
  return {
    text:
      `🛍️ ${persona.shopName} carries ${UMBRELLA_CATEGORIES.length} main departments:\n\n${lines}\n\n` +
      `Reply with any department name to see products (e.g. "Computing", "Fashion", "Beauty"), ` +
      `or browse everything at ${SHOP_URL}`,
    suggestions: UMBRELLA_CATEGORIES.slice(0, 4).map((u) => u.label),
  };
}

async function merchantInventoryReply(q: string): Promise<BotReply | null> {
  try {
    const ql = q.toLowerCase();
    const items = await prisma.inventoryItem.findMany({
      where: {
        OR: [
          { name: { contains: ql } },
          { description: { contains: ql } },
          { tags: { contains: ql } },
          { category: { contains: ql } },
          { sku: { contains: ql } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });

    if (items.length === 0) return null;

    const lines = items.map((item, idx) => {
      const activePrice = item.salePrice ?? item.price;
      const priceStr =
        item.salePrice && item.salePrice < item.price
          ? `GHS ${item.salePrice.toFixed(2)} (was GHS ${item.price.toFixed(2)})`
          : `GHS ${activePrice.toFixed(2)}`;
      const stockStatus =
        item.stock === 0 ? "Out of stock" : item.stock <= item.reorderAt ? `Low stock (${item.stock})` : `${item.stock} in stock`;
      return `${idx + 1}. ${item.name}\n   ${priceStr} · ${stockStatus}`;
    });

    return {
      text:
        `🏪 From our store for "${q}":\n\n${lines.join("\n\n")}\n\n` +
        `Shop at ${SHOP_URL}?q=${encodeURIComponent(q)}`,
    };
  } catch {
    return null;
  }
}

async function searchReply(q: string): Promise<BotReply> {
  try {
    const { products } = await getProducts({ q, limit: 5 });
    if (products.length === 0) {
      return {
        text:
          `I couldn't find "${q}" in our catalog. 😕\n\n` +
          `Try a different word, or type "categories" to see what we sell.`,
        suggestions: ["Show categories", "Talk to agent"],
      };
    }
    const lines = products.map((p, i) => formatProductLine(p, i)).join("\n\n");
    return {
      text:
        `Here's what I found for "${q}":\n\n${lines}\n\n` +
        `See more at ${SHOP_URL}?q=${encodeURIComponent(q)}`,
    };
  } catch {
    return { text: "Sorry, search isn't responding right now. Please try again shortly." };
  }
}

async function categoryReply(slug: string): Promise<BotReply> {
  try {
    const { products } = await getProducts({ category: slug, limit: 5 });
    if (products.length === 0) {
      return { text: `No products available in "${slug}" right now.` };
    }
    const lines = products.map((p, i) => formatProductLine(p, i)).join("\n\n");
    return {
      text:
        `🛍️ ${slug.replace(/-/g, " ")} — top ${products.length}:\n\n${lines}\n\n` +
        `Full list: ${SHOP_URL}?category=${slug}`,
    };
  } catch {
    return { text: "Sorry, that category isn't responding right now." };
  }
}

async function priceReply(text: string): Promise<BotReply> {
  // Extract subject after "price of" / "how much is" / "cost of"
  const m = text.match(/(?:price of|cost of|how much (?:is|for))\s+(.+)/i);
  const q = m ? m[1].trim() : text.replace(/\b(price|cost|how much)\b/gi, "").trim();
  if (!q) return { text: "Which product would you like the price of?" };
  try {
    const { products } = await getProducts({ q, limit: 3 });
    if (products.length === 0) {
      return { text: `I couldn't find "${q}". Try a different name?` };
    }
    const lines = products.map((p, i) => formatProductLine(p, i)).join("\n\n");
    return { text: `💰 Pricing for "${q}":\n\n${lines}` };
  } catch {
    return { text: "Sorry, I couldn't fetch pricing right now." };
  }
}

function contactReply(persona: Required<Persona>): BotReply {
  return {
    text:
      `Sure — a human will reply shortly. In the meantime you can reach ${persona.shopName} directly:\n\n` +
      `📞 ${persona.contactPhone}\n` +
      `✉️  ${persona.contactEmail}\n` +
      `🕒 ${persona.hours}`,
  };
}

function hoursReply(persona: Required<Persona>): BotReply {
  return { text: `We're open ${persona.hours}. Out of hours, drop us a message and we'll reply first thing.` };
}

function contactInfoReply(persona: Required<Persona>): BotReply {
  return {
    text:
      `Here's how to reach ${persona.shopName} directly:\n\n` +
      `📞 ${persona.contactPhone}\n` +
      `✉️  ${persona.contactEmail}`,
  };
}

/**
 * Main entry point.
 * @param rawMessage - the user's message
 * @param personaOverride - optional persona to customise greeting / contact replies
 */
export async function reply(rawMessage: string, personaOverride?: Persona): Promise<BotReply> {
  const persona = resolve(personaOverride);
  const text = norm(rawMessage);
  if (!text) return welcome(persona);

  // 1. Contact / human handoff
  if (any(text, CONTACT_WORDS)) return contactReply(persona);

  // 2. Hours
  if (any(text, HOURS_WORDS)) return hoursReply(persona);

  // 3. Contact info (phone / email)
  if (any(text, CONTACT_INFO_WORDS)) return contactInfoReply(persona);

  // 4. Greetings
  if (GREETINGS.some((g) => text === g || text.startsWith(g + " "))) {
    return welcome(persona);
  }

  // 5. Help / menu
  if (any(text, HELP_WORDS)) return welcome(persona);

  // 6. Match against Akanadehye's own category structure first
  // Check umbrella labels (e.g. "Computing", "Sports & Outdoors")
  const umbrellaMatch = UMBRELLA_CATEGORIES.find(
    (u) =>
      text === u.label.toLowerCase() ||
      text.includes(u.label.toLowerCase()) ||
      text === u.primarySlug
  );
  if (umbrellaMatch) return categoryReply(umbrellaMatch.primarySlug);

  // Check sub-category items (e.g. "smartphones", "laptops", "lipstick")
  for (const u of UMBRELLA_CATEGORIES) {
    for (const g of u.groups) {
      for (const item of g.items) {
        if (
          text === item.slug ||
          text === item.label.toLowerCase() ||
          text.includes(item.slug.replace(/-/g, " "))
        ) {
          return categoryReply(item.slug);
        }
      }
    }
  }

  // 7. List categories
  if (any(text, CATEGORY_WORDS) || any(text, ALL_WORDS)) return listCategoriesReply(persona);

  // 8. Price query
  if (any(text, PRICE_WORDS)) {
    const merchantHit = await merchantInventoryReply(text.replace(/\b(price of|cost of|how much is|how much for|price|cost|how much)\b/gi, "").trim());
    if (merchantHit) return merchantHit;
    return priceReply(text);
  }

  // 9. "Do you have / in stock"
  if (any(text, STOCK_WORDS)) {
    const q = text.replace(/\b(do you have|got any|in stock|available|stock|have)\b/g, "").trim();
    if (q) {
      const merchantHit = await merchantInventoryReply(q);
      if (merchantHit) return merchantHit;
      return searchReply(q);
    }
    return listCategoriesReply(persona);
  }

  // 10. Fallback: check merchant inventory first, then catalog
  const merchantHit = await merchantInventoryReply(text);
  if (merchantHit) return merchantHit;
  return searchReply(text);
}
