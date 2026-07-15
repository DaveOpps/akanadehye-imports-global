import "server-only";

/**
 * Session usage meter for the tax assistant.
 *
 * Every Anthropic call the tax engine makes records its token usage here, and
 * we price it against the configured model. Totals are held in memory per
 * server instance, so on Vercel they reset on each cold start and are counted
 * per-instance (not a cluster-wide bill). Anthropic's Console remains the
 * authoritative source of truth — this is a live, in-session estimate.
 */

type ModelPricing = { inputPerMTok: number; outputPerMTok: number };

// USD per 1M tokens. Source: claude-api pricing reference.
const PRICING: Record<string, ModelPricing> = {
  "claude-haiku-4-5": { inputPerMTok: 1.0, outputPerMTok: 5.0 },
  "claude-sonnet-5": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  "claude-sonnet-4-6": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  "claude-opus-4-8": { inputPerMTok: 5.0, outputPerMTok: 25.0 },
  "claude-opus-4-7": { inputPerMTok: 5.0, outputPerMTok: 25.0 },
  "claude-fable-5": { inputPerMTok: 10.0, outputPerMTok: 50.0 },
};

function pricingFor(model: string): ModelPricing {
  for (const key of Object.keys(PRICING)) {
    if (model.startsWith(key)) return PRICING[key];
  }
  return PRICING["claude-haiku-4-5"]; // sensible default
}

const stats = {
  startedAt: Date.now(),
  calls: 0,
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
};

export type ApiUsage = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
} | null | undefined;

/** Record one Anthropic call's usage. Safe to call with a possibly-undefined usage object. */
export function recordUsage(model: string, usage: ApiUsage): void {
  if (!usage) return;
  stats.calls += 1;
  stats.inputTokens += usage.input_tokens ?? 0;
  stats.outputTokens += usage.output_tokens ?? 0;
  stats.cacheReadTokens += usage.cache_read_input_tokens ?? 0;
  stats.cacheWriteTokens += usage.cache_creation_input_tokens ?? 0;
}

export type UsageStats = {
  model: string;
  startedAt: number;
  now: number;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalTokens: number;
  estCostUsd: number;
  pricing: ModelPricing;
};

export function getUsageStats(): UsageStats {
  const model = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";
  const p = pricingFor(model);
  // Cache reads bill at ~0.1x input, cache writes at ~1.25x input.
  const estCostUsd =
    (stats.inputTokens * p.inputPerMTok +
      stats.outputTokens * p.outputPerMTok +
      stats.cacheReadTokens * p.inputPerMTok * 0.1 +
      stats.cacheWriteTokens * p.inputPerMTok * 1.25) /
    1_000_000;

  return {
    model,
    startedAt: stats.startedAt,
    now: Date.now(),
    calls: stats.calls,
    inputTokens: stats.inputTokens,
    outputTokens: stats.outputTokens,
    cacheReadTokens: stats.cacheReadTokens,
    cacheWriteTokens: stats.cacheWriteTokens,
    totalTokens:
      stats.inputTokens + stats.outputTokens + stats.cacheReadTokens + stats.cacheWriteTokens,
    estCostUsd,
    pricing: p,
  };
}
