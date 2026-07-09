import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Import-tax "brain" for the super-admin calculator.
 *
 * Ghana import duty depends on HS classification, origin, and current GRA
 * levy rates — too nuanced to hardcode — so we let Claude reason it out and
 * return a structured breakdown. Everything is an ESTIMATE for planning; the
 * real figure is set by Customs at clearance.
 */

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";
const MAX_TOKENS = 2048;

export type TaxCalcInput = {
  productDescription: string;
  category?: string;
  originCountry: string;
  value: number; // FOB / customs value entered by the admin
  currency: "USD" | "GHS";
  exchangeRate?: number; // GHS per USD — used when currency is USD
  freight?: number; // same currency as value
  insurance?: number; // same currency as value
  quantity?: number;
};

export type TaxLineItem = {
  label: string;
  ratePercent: number | null;
  amountGhs: number;
  note?: string;
};

export type TaxBreakdown = {
  ok: true;
  hsCodeGuess: string;
  customsValueGhs: number; // CIF in GHS
  exchangeRateUsed: number | null;
  lineItems: TaxLineItem[];
  totalTaxesGhs: number;
  totalLandedCostGhs: number;
  effectiveTaxRatePercent: number;
  assumptions: string;
  disclaimer: string;
};

export type TaxError = { ok: false; error: string };

const SYSTEM_PROMPT = [
  "You are a Ghana import-duty and customs-tax specialist assisting the owner of Akanadehye Imports Global, a Ghana-based importer.",
  "You estimate the taxes and levies payable to the Ghana Revenue Authority (GRA) Customs Division when clearing imported goods.",
  "",
  "Apply the standard Ghana import-tax components on the CIF (Cost + Insurance + Freight) value, using current typical GRA practice:",
  "- Import Duty: 0%, 5%, 10% or 20% depending on the HS classification of the goods (raw materials/agri-machinery often lower; finished consumer goods often 20%).",
  "- Import VAT: 15% (on the duty-inclusive value).",
  "- NHIL (National Health Insurance Levy): 2.5%.",
  "- GETFund Levy: 2.5%.",
  "- COVID-19 Health Recovery Levy: 1%.",
  "- ECOWAS Levy (ETLS): 0.5% on CIF.",
  "- African Union Import Levy: 0.2% on CIF.",
  "- EXIM Levy: 0.75% on CIF.",
  "- Import/Network/Inspection charge: ~1% on CIF (approximate).",
  "Also mention Ghana Ports (GPHA) / shipping-line / terminal handling only if asked — do not add them to the tax total.",
  "",
  "Rules:",
  "- Work entirely in GHS. If given USD, convert using the provided exchange rate.",
  "- CIF value = product value + freight + insurance (convert all to GHS).",
  "- Make totals internally consistent: totalTaxes must equal the sum of the line-item amounts, and landed cost must equal CIF + totalTaxes.",
  "- Pick the single most likely HS classification and duty rate, and state your assumption plainly.",
  "- These are planning ESTIMATES. Always include a short disclaimer that the final assessment is determined by Customs at clearance based on the classified HS code and declared value.",
].join("\n");

const TAX_TOOL: Anthropic.Tool = {
  name: "report_tax_breakdown",
  description: "Report the estimated Ghana import-tax breakdown as structured data.",
  input_schema: {
    type: "object",
    properties: {
      hsCodeGuess: { type: "string", description: "Most likely HS code (e.g. '8433.60') or 'unknown' with a short reason." },
      customsValueGhs: { type: "number", description: "CIF value in GHS (product + freight + insurance)." },
      exchangeRateUsed: { type: ["number", "null"], description: "GHS per USD used, or null if input was already GHS." },
      lineItems: {
        type: "array",
        description: "Each tax/levy component.",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            ratePercent: { type: ["number", "null"] },
            amountGhs: { type: "number" },
            note: { type: "string" },
          },
          required: ["label", "amountGhs"],
        },
      },
      totalTaxesGhs: { type: "number" },
      totalLandedCostGhs: { type: "number", description: "CIF + total taxes." },
      effectiveTaxRatePercent: { type: "number", description: "totalTaxes / CIF * 100." },
      assumptions: { type: "string", description: "Key assumptions: HS class, duty rate chosen, origin treatment." },
      disclaimer: { type: "string" },
    },
    required: [
      "hsCodeGuess", "customsValueGhs", "lineItems", "totalTaxesGhs",
      "totalLandedCostGhs", "effectiveTaxRatePercent", "assumptions", "disclaimer",
    ],
  },
};

function buildUserPrompt(input: TaxCalcInput): string {
  const lines = [
    `Product: ${input.productDescription}`,
    input.category ? `Category: ${input.category}` : "",
    `Country of origin: ${input.originCountry}`,
    `Declared/FOB value: ${input.value} ${input.currency}`,
    input.freight != null ? `Freight: ${input.freight} ${input.currency}` : "Freight: not provided (assume a reasonable estimate and say so)",
    input.insurance != null ? `Insurance: ${input.insurance} ${input.currency}` : "Insurance: not provided (assume a reasonable estimate and say so)",
    input.quantity != null ? `Quantity: ${input.quantity} units` : "",
    input.currency === "USD" ? `Exchange rate: ${input.exchangeRate ?? "not provided"} GHS per USD` : "",
    "",
    "Estimate the Ghana import taxes and call report_tax_breakdown with the full breakdown in GHS.",
  ];
  return lines.filter(Boolean).join("\n");
}

export async function computeTaxBreakdown(input: TaxCalcInput): Promise<TaxBreakdown | TaxError> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "The tax assistant is not configured (missing ANTHROPIC_API_KEY)." };

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: [TAX_TOOL],
      tool_choice: { type: "tool", name: "report_tax_breakdown" },
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    });

    const toolUse = msg.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    if (!toolUse) return { ok: false, error: "The tax assistant returned no result. Please try again." };

    const d = toolUse.input as Omit<TaxBreakdown, "ok">;
    return { ok: true, ...d };
  } catch (err) {
    return { ok: false, error: (err as Error).message || "Tax calculation failed." };
  }
}

export type ChatMsg = { role: "user" | "assistant"; content: string };

export async function taxChat(history: ChatMsg[], context?: TaxBreakdown | null): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "The tax assistant is not configured (missing ANTHROPIC_API_KEY).";

  const contextNote = context
    ? `\n\nThe admin just calculated this breakdown (GHS): CIF ${context.customsValueGhs}, total taxes ${context.totalTaxesGhs}, landed cost ${context.totalLandedCostGhs}, effective rate ${context.effectiveTaxRatePercent}%. HS guess: ${context.hsCodeGuess}. Refer to it when relevant.`
    : "";

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT + contextNote +
        "\n\nWhen chatting, keep answers concise and practical for a business owner. Use GHS. Remind that figures are estimates when giving numbers.",
      messages: history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n\n")
      .trim();
    return text || "I couldn't produce an answer — please rephrase.";
  } catch (err) {
    return `Sorry, the assistant hit an error: ${(err as Error).message}`;
  }
}
