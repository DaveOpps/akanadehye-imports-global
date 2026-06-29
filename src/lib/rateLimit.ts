/**
 * Lightweight in-memory rate limiter for the bot webhooks.
 *
 * Every inbound chat message triggers a Claude call (and the tool-runner can
 * make several Anthropic requests per message), so without throttling a single
 * spammer — or a traffic spike — can burn through the Anthropic quota fast.
 * This caps message volume per user and globally before any model call happens.
 *
 * Storage is a module-level Map (fixed-window counters). On Vercel each warm
 * serverless instance keeps its own counters, so the global cap is per-instance,
 * not a hard cluster-wide ceiling. That's fine for stopping the common abuse
 * vector (one chat hammering the bot). For a strict cross-instance guarantee,
 * swap the `hit()` backend for Supabase or Upstash Redis — the public API
 * (`checkBotRateLimit`) stays the same.
 */

export type RateRule = { limit: number; windowMs: number };
export type RateResult = { allowed: boolean; remaining: number; retryAfterSec: number };

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

/** Opportunistic sweep so the Map doesn't grow unbounded from one-off keys. */
function sweep(now: number) {
  if (store.size < 5000) return;
  for (const [key, b] of store) {
    if (b.resetAt <= now) store.delete(key);
  }
}

/**
 * Record one hit against `key` under `rule` and report whether it's allowed.
 * Fixed-window: the counter resets to 0 once the window elapses.
 */
export function hit(key: string, rule: RateRule): RateResult {
  const now = Date.now();
  let b = store.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + rule.windowMs };
    store.set(key, b);
    sweep(now);
  }
  b.count += 1;
  const allowed = b.count <= rule.limit;
  return {
    allowed,
    remaining: Math.max(0, rule.limit - b.count),
    retryAfterSec: allowed ? 0 : Math.ceil((b.resetAt - now) / 1000),
  };
}

// ---------- Bot-specific policy ----------

function envInt(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback;
}

/** Burst limit: stops one chat firing many messages in quick succession. */
const PER_USER_BURST: RateRule = {
  limit: envInt("BOT_RATE_USER_BURST_LIMIT", 6),
  windowMs: envInt("BOT_RATE_USER_BURST_WINDOW_SEC", 20) * 1000,
};

/** Sustained per-user limit over an hour. */
const PER_USER_HOUR: RateRule = {
  limit: envInt("BOT_RATE_USER_HOUR_LIMIT", 60),
  windowMs: 60 * 60 * 1000,
};

/** Global ceiling across all users (per instance) — the Anthropic-quota guard. */
const GLOBAL_PER_MIN: RateRule = {
  limit: envInt("BOT_RATE_GLOBAL_PER_MIN", 60),
  windowMs: 60 * 1000,
};

export type BotLimitResult =
  | { ok: true }
  | { ok: false; scope: "user" | "global"; retryAfterSec: number };

// ---------- Observability (for the monitoring dashboard) ----------

const stats = {
  startedAt: Date.now(),
  checks: 0,
  allowed: 0,
  blocked: 0,
  blockedUser: 0,
  blockedGlobal: 0,
};

/** Friendly replies sent when a limit trips — these never call Claude. */
export const RATE_LIMIT_MESSAGES = {
  user: "You're sending messages a little fast 🙏 Give me a few seconds, then try again.",
  global: "We're handling a lot of messages right now — please try again in a moment 🙏",
};

/**
 * Check all bot limits for one sender. Per-user limits are checked first so a
 * single spammer trips their own cap without inflating the shared global count.
 *
 * @param identity stable per-sender key, e.g. `tg:<chatId>` or `wa:<phone>`.
 */
export function checkBotRateLimit(identity: string): BotLimitResult {
  stats.checks += 1;

  const burst = hit(`bot:burst:${identity}`, PER_USER_BURST);
  if (!burst.allowed) {
    stats.blocked += 1;
    stats.blockedUser += 1;
    return { ok: false, scope: "user", retryAfterSec: burst.retryAfterSec };
  }

  const hour = hit(`bot:hour:${identity}`, PER_USER_HOUR);
  if (!hour.allowed) {
    stats.blocked += 1;
    stats.blockedUser += 1;
    return { ok: false, scope: "user", retryAfterSec: hour.retryAfterSec };
  }

  const global = hit("bot:global", GLOBAL_PER_MIN);
  if (!global.allowed) {
    stats.blocked += 1;
    stats.blockedGlobal += 1;
    return { ok: false, scope: "global", retryAfterSec: global.retryAfterSec };
  }

  stats.allowed += 1;
  return { ok: true };
}

// ---------- Dashboard snapshot ----------

export type RateLimitUser = {
  identity: string;
  channel: string;
  burstCount: number;
  burstLimit: number;
  burstResetInSec: number;
  hourCount: number;
  hourLimit: number;
  throttled: boolean;
};

export type RateLimitStats = {
  startedAt: number;
  now: number;
  config: {
    burst: RateRule;
    hour: RateRule;
    global: RateRule;
  };
  totals: {
    checks: number;
    allowed: number;
    blocked: number;
    blockedUser: number;
    blockedGlobal: number;
  };
  global: { count: number; limit: number; remaining: number; resetInSec: number };
  users: RateLimitUser[];
};

const CHANNEL_LABELS: Record<string, string> = {
  tg: "Telegram",
  wa: "WhatsApp",
  test: "Test console",
};

function channelOf(identity: string): string {
  const prefix = identity.split(":")[0];
  return CHANNEL_LABELS[prefix] ?? "Other";
}

/**
 * Snapshot of the limiter for the admin dashboard. Reflects this server
 * instance only (in-memory store) — see the note at the top of this file.
 */
export function getRateLimitStats(): RateLimitStats {
  const now = Date.now();

  // Global bucket
  const g = store.get("bot:global");
  const gCount = g && g.resetAt > now ? g.count : 0;
  const gReset = g && g.resetAt > now ? Math.ceil((g.resetAt - now) / 1000) : 0;

  // Per-user buckets: merge burst + hour rows keyed by identity.
  const byIdentity = new Map<string, RateLimitUser>();
  const ensure = (identity: string): RateLimitUser => {
    let u = byIdentity.get(identity);
    if (!u) {
      u = {
        identity,
        channel: channelOf(identity),
        burstCount: 0,
        burstLimit: PER_USER_BURST.limit,
        burstResetInSec: 0,
        hourCount: 0,
        hourLimit: PER_USER_HOUR.limit,
        throttled: false,
      };
      byIdentity.set(identity, u);
    }
    return u;
  };

  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) continue; // expired window — ignore
    if (key.startsWith("bot:burst:")) {
      const u = ensure(key.slice("bot:burst:".length));
      u.burstCount = bucket.count;
      u.burstResetInSec = Math.ceil((bucket.resetAt - now) / 1000);
    } else if (key.startsWith("bot:hour:")) {
      const u = ensure(key.slice("bot:hour:".length));
      u.hourCount = bucket.count;
    }
  }

  const users = [...byIdentity.values()]
    .map((u) => ({
      ...u,
      throttled: u.burstCount >= u.burstLimit || u.hourCount >= u.hourLimit,
    }))
    .sort((a, b) => b.burstCount - a.burstCount);

  return {
    startedAt: stats.startedAt,
    now,
    config: { burst: PER_USER_BURST, hour: PER_USER_HOUR, global: GLOBAL_PER_MIN },
    totals: {
      checks: stats.checks,
      allowed: stats.allowed,
      blocked: stats.blocked,
      blockedUser: stats.blockedUser,
      blockedGlobal: stats.blockedGlobal,
    },
    global: {
      count: gCount,
      limit: GLOBAL_PER_MIN.limit,
      remaining: Math.max(0, GLOBAL_PER_MIN.limit - gCount),
      resetInSec: gReset,
    },
    users,
  };
}
