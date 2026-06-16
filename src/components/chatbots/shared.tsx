"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/* Shared types                                                        */
/* ------------------------------------------------------------------ */

export type BotStatus = {
  telegram: { configured: boolean; hint: string | null };
  whatsapp: { twilio: boolean; meta: boolean; configured: boolean };
  claude: { configured: boolean; model: string | null };
};

/* ------------------------------------------------------------------ */
/* useBotStatus — polls /api/bots/status                               */
/* ------------------------------------------------------------------ */

export function useBotStatus() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/bots/status")
      .then((r) => r.json())
      .then((s) => alive && setStatus(s))
      .catch(() => alive && setStatus(null));
    return () => {
      alive = false;
    };
  }, []);
  return status;
}

/* ------------------------------------------------------------------ */
/* StatusPill — Active (pulse) | Setup needed | …                     */
/* ------------------------------------------------------------------ */

export function StatusPill({
  configured,
  loading,
  size = "md",
}: {
  configured: boolean;
  loading: boolean;
  size?: "sm" | "md";
}) {
  const padding = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  if (loading) return <span className={`font-semibold bg-white/15 rounded-full ${padding}`}>…</span>;
  if (configured) {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold bg-white/95 text-[color:var(--brand-navy)] rounded-full ${padding}`}>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
        </span>
        Active
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold bg-amber-100 text-amber-800 rounded-full ${padding}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
      Setup needed
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* ChannelCard — gradient brand card used on the chatbots overview     */
/* ------------------------------------------------------------------ */

export function ChannelCard({
  name,
  gradient,
  configured,
  loading,
  detail,
  iconPath,
  setupHref,
}: {
  name: string;
  gradient: string;
  configured: boolean;
  loading: boolean;
  detail: string;
  iconPath: string;
  setupHref: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br ${gradient} shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d={iconPath} />
            </svg>
          </span>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/70 font-semibold">
              Channel
            </div>
            <div className="text-lg font-bold tracking-tight">{name}</div>
          </div>
        </div>
        <StatusPill configured={configured} loading={loading} />
      </div>

      <p className="mt-4 text-sm text-white/90 leading-relaxed">{detail}</p>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-white/70">
          {configured ? "Webhook ready · brain shared with test chat" : "Bot brain ready — just plug in credentials"}
        </span>
        <a
          href={setupHref}
          className="text-xs font-bold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full transition"
        >
          {configured ? "View setup" : "Set up →"}
        </a>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Icon paths reused across pages                                      */
/* ------------------------------------------------------------------ */

export const TELEGRAM_ICON =
  "M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.24 3.64 11.95c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.7L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z";

export const WHATSAPP_ICON =
  "M20.52 3.48A11.85 11.85 0 0012.04 0C5.5 0 .2 5.3.2 11.85c0 2.09.55 4.13 1.6 5.93L0 24l6.36-1.67a11.83 11.83 0 005.68 1.45h.01c6.54 0 11.84-5.3 11.84-11.85a11.8 11.8 0 00-3.37-8.45zM17.5 14.58c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07a8.16 8.16 0 01-2.4-1.48 9 9 0 01-1.66-2.07c-.17-.3-.02-.45.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01a1.1 1.1 0 00-.8.37c-.27.3-1.05 1.02-1.05 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.3 1.27.49 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z";

/* ------------------------------------------------------------------ */
/* Step — numbered step for setup pages                                */
/* ------------------------------------------------------------------ */

export function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)] font-bold text-xs">
        {n}
      </span>
      <div className="flex-1 text-sm leading-relaxed">
        <div className="font-bold mb-1">{title}</div>
        <div className="text-[color:var(--brand-navy)]/90">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Code + CodeBlock with copy button                                   */
/* ------------------------------------------------------------------ */

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-xs bg-[color:var(--brand-cream)] px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}

export function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative mt-2 group">
      <pre className="font-mono text-xs bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)] p-3 pr-16 rounded-lg overflow-x-auto whitespace-pre-wrap">
        {children}
      </pre>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(children);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          } catch {}
        }}
        className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[color:var(--brand-gold)] text-[color:var(--brand-navy)] hover:brightness-110 transition opacity-80 group-hover:opacity-100"
        aria-label="Copy to clipboard"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Field — reusable form label wrapper                                 */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
    </label>
  );
}
