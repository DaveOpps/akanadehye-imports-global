"use client";

import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";

/* ── types (mirror lib/rateLimit RateLimitStats) ───────────────────── */

type Rule = { limit: number; windowMs: number };
type RLUser = {
  identity: string;
  channel: string;
  burstCount: number;
  burstLimit: number;
  burstResetInSec: number;
  hourCount: number;
  hourLimit: number;
  throttled: boolean;
};
type Stats = {
  ok: boolean;
  startedAt: number;
  now: number;
  config: { burst: Rule; hour: Rule; global: Rule };
  totals: { checks: number; allowed: number; blocked: number; blockedUser: number; blockedGlobal: number };
  global: { count: number; limit: number; remaining: number; resetInSec: number };
  users: RLUser[];
};

const REFRESH_MS = 3000;

/* ── helpers ───────────────────────────────────────────────────────── */

function fmtWindow(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s % 3600 === 0) return `${s / 3600}h`;
  if (s % 60 === 0) return `${s / 60}m`;
  return `${s}s`;
}

function fmtUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function barColor(ratio: number): string {
  if (ratio >= 1) return "bg-red-500";
  if (ratio >= 0.7) return "bg-amber-500";
  return "bg-green-500";
}

/* ── page ───────────────────────────────────────────────────────────── */

export default function RateLimitsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    let alive = true;
    async function load() {
      if (pausedRef.current) return;
      try {
        const res = await fetch("/api/bots/rate-limit", { cache: "no-store" });
        if (res.status === 401) {
          if (alive) setError("You need admin access to view rate-limit metrics.");
          return;
        }
        const data = (await res.json()) as Stats;
        if (alive) {
          setStats(data);
          setError(null);
          setLastUpdated(Date.now());
        }
      } catch {
        if (alive) setError("Couldn't reach the metrics endpoint.");
      }
    }
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const blockRate =
    stats && stats.totals.checks > 0
      ? Math.round((stats.totals.blocked / stats.totals.checks) * 100)
      : 0;

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Engage" },
          { label: "Chatbots", href: "/admin/chatbots" },
          { label: "Rate limits" },
        ]}
        title="Rate limit monitor"
        subtitle="Live view of bot throttling — protects your Anthropic quota from spam and spikes."
      />

      {/* Live indicator */}
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
          {!paused && !error ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-green-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
              </span>
              Live · refreshing every {REFRESH_MS / 1000}s
            </span>
          ) : (
            <span className="font-semibold text-amber-700">Paused</span>
          )}
          {lastUpdated && (
            <span>· updated {new Date(lastUpdated).toLocaleTimeString()}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[color:var(--border)] hover:bg-[color:var(--brand-cream)] transition"
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50 text-red-800 text-sm mb-6">{error}</div>
      )}

      {/* In-memory caveat */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 leading-relaxed">
        <strong>Note:</strong> counters live in memory on this server instance and reset on
        deploy/restart (and on Vercel each warm instance counts separately). Great for spotting
        abuse and tuning limits; for a hard cluster-wide ceiling, back the limiter with Supabase or
        Redis.
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="Checks" value={stats ? stats.totals.checks.toLocaleString() : "—"} sub="messages assessed" />
        <Kpi label="Allowed" value={stats ? stats.totals.allowed.toLocaleString() : "—"} sub="passed to the bot brain" tone="green" />
        <Kpi
          label="Blocked"
          value={stats ? stats.totals.blocked.toLocaleString() : "—"}
          sub={stats ? `${stats.totals.blockedUser} user · ${stats.totals.blockedGlobal} global` : "throttled"}
          tone={stats && stats.totals.blocked > 0 ? "clay" : "muted"}
        />
        <Kpi
          label="Block rate"
          value={stats ? `${blockRate}%` : "—"}
          sub={stats ? `since ${fmtUptime(stats.now - stats.startedAt)} ago` : "since start"}
          tone={blockRate >= 20 ? "clay" : "muted"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Global ceiling */}
          <section className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-base">Global ceiling (this minute)</h2>
              {stats && (
                <span className="text-xs text-[color:var(--muted)]">
                  resets in {stats.global.resetInSec}s
                </span>
              )}
            </div>
            {stats ? (
              <>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-[color:var(--brand-navy)]">
                    {stats.global.count}
                  </span>
                  <span className="text-sm text-[color:var(--muted)]">/ {stats.global.limit} requests</span>
                </div>
                <Bar ratio={stats.global.count / stats.global.limit} />
                <p className="mt-2 text-xs text-[color:var(--muted)]">
                  {stats.global.remaining} remaining before the bot pauses all new messages this minute.
                </p>
              </>
            ) : (
              <Skeleton />
            )}
          </section>

          {/* Active users */}
          <section className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-base">Active senders</h2>
              <span className="text-xs text-[color:var(--muted)]">
                {stats ? `${stats.users.length} in current windows` : ""}
              </span>
            </div>
            {!stats ? (
              <Skeleton />
            ) : stats.users.length === 0 ? (
              <p className="text-sm text-[color:var(--muted)] py-6 text-center">
                No active senders right now. Message a bot and watch this fill up.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wider text-[color:var(--muted)] border-b border-[color:var(--border)]">
                      <th className="pb-2 font-semibold">Sender</th>
                      <th className="pb-2 font-semibold">Channel</th>
                      <th className="pb-2 font-semibold w-40">Burst</th>
                      <th className="pb-2 font-semibold">Hour</th>
                      <th className="pb-2 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.users.map((u) => (
                      <tr key={u.identity} className="border-b border-[color:var(--border)]/60 last:border-0">
                        <td className="py-2.5 font-mono text-xs max-w-[180px] truncate" title={u.identity}>
                          {u.identity}
                        </td>
                        <td className="py-2.5 text-[color:var(--muted)]">{u.channel}</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-[60px]">
                              <Bar ratio={u.burstCount / u.burstLimit} thin />
                            </div>
                            <span className="text-xs tabular-nums text-[color:var(--muted)] shrink-0">
                              {u.burstCount}/{u.burstLimit}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 text-xs tabular-nums text-[color:var(--muted)]">
                          {u.hourCount}/{u.hourLimit}
                        </td>
                        <td className="py-2.5 text-right">
                          {u.throttled ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              Throttled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar: active limits */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card !p-4">
            <h3 className="font-bold text-sm mb-3">Active limits</h3>
            <div className="space-y-3">
              <LimitRow
                title="Per-user burst"
                value={stats ? `${stats.config.burst.limit} / ${fmtWindow(stats.config.burst.windowMs)}` : "—"}
                env="BOT_RATE_USER_BURST_LIMIT"
              />
              <LimitRow
                title="Per-user hourly"
                value={stats ? `${stats.config.hour.limit} / ${fmtWindow(stats.config.hour.windowMs)}` : "—"}
                env="BOT_RATE_USER_HOUR_LIMIT"
              />
              <LimitRow
                title="Global ceiling"
                value={stats ? `${stats.config.global.limit} / ${fmtWindow(stats.config.global.windowMs)}` : "—"}
                env="BOT_RATE_GLOBAL_PER_MIN"
              />
            </div>
            <p className="mt-3 text-[11px] text-[color:var(--muted)] leading-relaxed">
              Override any limit via the matching env var in <code className="font-mono">.env.local</code> (or
              Vercel project settings), then redeploy.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ── small components ──────────────────────────────────────────────── */

function Kpi({
  label,
  value,
  sub,
  tone = "navy",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "navy" | "green" | "clay" | "muted";
}) {
  const color = {
    navy: "text-[color:var(--brand-navy)]",
    green: "text-green-600",
    clay: "text-[color:var(--brand-clay)]",
    muted: "text-[color:var(--brand-navy)]",
  }[tone];
  return (
    <div className="card !p-4">
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--muted)] font-semibold">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-[color:var(--muted)] mt-0.5">{sub}</div>
    </div>
  );
}

function Bar({ ratio, thin }: { ratio: number; thin?: boolean }) {
  const pct = Math.min(100, Math.max(0, ratio * 100));
  return (
    <div className={`w-full rounded-full bg-[color:var(--brand-cream)] overflow-hidden ${thin ? "h-1.5" : "h-2.5"}`}>
      <div className={`h-full rounded-full transition-all ${barColor(ratio)}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function LimitRow({ title, value, env }: { title: string; value: string; env: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[color:var(--brand-navy)]">{title}</span>
        <span className="text-sm font-bold tabular-nums">{value}</span>
      </div>
      <code className="text-[10px] font-mono text-[color:var(--muted)]">{env}</code>
    </div>
  );
}

function Skeleton() {
  return <div className="h-16 rounded-lg bg-[color:var(--brand-cream)] animate-pulse" />;
}
