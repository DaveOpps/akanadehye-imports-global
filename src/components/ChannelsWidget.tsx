"use client";

import Link from "next/link";
import {
  TELEGRAM_ICON,
  WHATSAPP_ICON,
  useBotStatus,
} from "@/components/chatbots/shared";

/**
 * Channels widget for the admin overview.
 *
 * Sits between the quick-action tiles and Recent transactions. Surfaces
 * live status of both bot channels at a glance, plus placeholder metrics
 * that fill in once real conversations land.
 */
export default function ChannelsWidget() {
  const status = useBotStatus();
  const loading = status === null;

  return (
    <section className="rounded-2xl bg-white border border-[color:var(--border)] overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 py-3 bg-gradient-to-r from-[color:var(--brand-navy)] to-[color:var(--brand-navy-soft)] text-white flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-bold text-base tracking-tight">Customer engagement</h2>
            {status?.claude.configured && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-[color:var(--brand-gold)]/25 text-[color:var(--brand-gold)] border border-[color:var(--brand-gold)]/40 px-1.5 py-0.5 rounded">
                ✦ Claude
              </span>
            )}
          </div>
          <p className="text-[10px] text-white/70">
            Bot replies via WhatsApp & Telegram, 24/7
          </p>
        </div>
        <Link
          href="/admin/chatbots"
          className="text-xs font-bold bg-[color:var(--brand-gold)] text-[color:var(--brand-navy)] hover:brightness-110 px-3 py-1.5 rounded-full transition"
        >
          Open chatbots →
        </Link>
      </div>

      {/* Channels row */}
      <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[color:var(--border)]">
        <ChannelRow
          name="WhatsApp"
          color="text-[#25D366]"
          iconPath={WHATSAPP_ICON}
          configured={status?.whatsapp.configured ?? false}
          loading={loading}
          setupHref="/admin/chatbots/whatsapp"
          detail={
            status?.whatsapp.configured
              ? status.whatsapp.twilio
                ? "Twilio sandbox"
                : "Meta Cloud API"
              : "Not connected"
          }
        />
        <ChannelRow
          name="Telegram"
          color="text-[#0088cc]"
          iconPath={TELEGRAM_ICON}
          configured={status?.telegram.configured ?? false}
          loading={loading}
          setupHref="/admin/chatbots/telegram"
          detail={status?.telegram.configured ? "Bot token connected" : "Not connected"}
        />
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-4 divide-x divide-[color:var(--border)] border-t border-[color:var(--border)] bg-[color:var(--brand-cream)]/40">
        <Metric label="Today" value="0" sub="conversations" />
        <Metric label="Messages" value="0" sub="handled" />
        <Metric label="Avg reply" value="—" sub="instant" />
        <Metric label="Handoffs" value="0" sub="to human" />
      </div>
    </section>
  );
}

function ChannelRow({
  name,
  color,
  iconPath,
  configured,
  loading,
  setupHref,
  detail,
}: {
  name: string;
  color: string;
  iconPath: string;
  configured: boolean;
  loading: boolean;
  setupHref: string;
  detail: string;
}) {
  return (
    <Link
      href={setupHref}
      className="flex items-center gap-4 px-5 py-4 hover:bg-[color:var(--brand-cream)]/40 transition"
    >
      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--brand-cream)] ${color}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d={iconPath} />
        </svg>
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-[color:var(--brand-navy)]">{name}</span>
          <LightStatusPill configured={configured} loading={loading} />
        </div>
        <div className="text-xs text-[color:var(--muted)] mt-0.5 truncate">{detail}</div>
      </div>
      <span className="text-[color:var(--muted)] text-sm shrink-0">→</span>
    </Link>
  );
}

function LightStatusPill({ configured, loading }: { configured: boolean; loading: boolean }) {
  if (loading) {
    return <span className="text-[10px] font-semibold bg-[color:var(--brand-cream)] text-[color:var(--muted)] px-2 py-0.5 rounded-full">…</span>;
  }
  if (configured) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-600" />
        </span>
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
      Setup needed
    </span>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="px-3 py-3 text-center">
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--muted)] font-bold">{label}</div>
      <div className="mt-0.5 text-xl font-bold text-[color:var(--brand-navy)] tabular-nums">{value}</div>
      <div className="text-[10px] text-[color:var(--muted)] truncate">{sub}</div>
    </div>
  );
}
