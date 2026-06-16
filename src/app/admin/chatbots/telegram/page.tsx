"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import {
  ChannelCard,
  Code,
  CodeBlock,
  TELEGRAM_ICON,
  useBotStatus,
} from "@/components/chatbots/shared";

/* ── types ─────────────────────────────────────────────────────── */

type BotInfo = {
  id: number;
  first_name: string;
  username: string;
  is_bot: boolean;
};

type WebhookInfo = {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_message?: string;
};

/* ── helpers ────────────────────────────────────────────────────── */

function StepBadge({ n, done }: { n: number; done?: boolean }) {
  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        done
          ? "bg-green-500 text-white"
          : "bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)]"
      }`}
    >
      {done ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        n
      )}
    </span>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

async function telegramSetup(body: object) {
  const res = await fetch("/api/bots/telegram/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

/* ── page ───────────────────────────────────────────────────────── */

export default function TelegramSetupPage() {
  const [host, setHost] = useState("");
  const status = useBotStatus();

  // token form
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null);
  const [validating, setValidating] = useState(false);
  const [tokenError, setTokenError] = useState("");

  // webhook
  const [webhookBusy, setWebhookBusy] = useState(false);
  const [webhookMsg, setWebhookMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // clipboard
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setHost(window.location.origin);
  }, []);

  const webhookUrl = `${host}/api/bots/telegram`;
  const isWebhookHere = webhookInfo ? webhookInfo.url === webhookUrl : false;

  async function validateToken() {
    if (!token.trim()) { setTokenError("Paste your bot token first."); return; }
    setValidating(true);
    setTokenError("");
    setBotInfo(null);
    setWebhookInfo(null);
    setWebhookMsg(null);
    try {
      const [me, wh] = await Promise.all([
        telegramSetup({ action: "validate", token }),
        telegramSetup({ action: "getWebhookInfo", token }),
      ]);
      if (me.ok) {
        setBotInfo(me.result as BotInfo);
        if (wh.ok) setWebhookInfo(wh.result as WebhookInfo);
      } else {
        setTokenError(me.description ?? "Invalid token — double-check what BotFather sent.");
      }
    } catch {
      setTokenError("Network error — check your connection.");
    } finally {
      setValidating(false);
    }
  }

  async function registerWebhook() {
    setWebhookBusy(true);
    setWebhookMsg(null);
    try {
      const data = await telegramSetup({ action: "setWebhook", token, webhookUrl });
      if (data.ok) {
        setWebhookMsg({ text: "Webhook registered! Telegram messages will now reach your server.", ok: true });
        const wh = await telegramSetup({ action: "getWebhookInfo", token });
        if (wh.ok) setWebhookInfo(wh.result as WebhookInfo);
      } else {
        setWebhookMsg({ text: data.description ?? "Failed to register webhook.", ok: false });
      }
    } catch {
      setWebhookMsg({ text: "Network error.", ok: false });
    } finally {
      setWebhookBusy(false);
    }
  }

  async function removeWebhook() {
    if (!confirm("Remove the webhook? Messages will stop arriving until you re-register it.")) return;
    setWebhookBusy(true);
    setWebhookMsg(null);
    try {
      const data = await telegramSetup({ action: "deleteWebhook", token });
      if (data.ok) {
        setWebhookMsg({ text: "Webhook removed.", ok: true });
        setWebhookInfo({ url: "", has_custom_certificate: false, pending_update_count: 0 });
      } else {
        setWebhookMsg({ text: data.description ?? "Failed.", ok: false });
      }
    } catch {
      setWebhookMsg({ text: "Network error.", ok: false });
    } finally {
      setWebhookBusy(false);
    }
  }

  function copyText(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      setter(true);
      setTimeout(() => setter(false), 1500);
    });
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Engage" },
          { label: "Chatbots", href: "/admin/chatbots" },
          { label: "Telegram" },
        ]}
        title="Telegram Bot"
        subtitle="Get a token → validate → register webhook. Takes 3 minutes."
      />

      {/* Status card */}
      <ChannelCard
        name="Telegram"
        gradient="from-[#0088cc] to-[#005c8a]"
        configured={status?.telegram.configured ?? false}
        loading={status === null}
        detail={
          status?.telegram.configured
            ? `Token connected (${status.telegram.hint}). Bot is live.`
            : "Token not set in .env.local — complete Step 3 below, then restart the server."
        }
        iconPath={TELEGRAM_ICON}
        setupHref="#step1"
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">

          {/* ── STEP 1: Token ─────────────────────────────────────── */}
          <div id="step1" className="card space-y-4">
            <div className="flex items-center gap-3">
              <StepBadge n={1} done={!!botInfo} />
              <div>
                <h2 className="font-bold text-base">Connect your bot token</h2>
                <p className="text-sm text-[color:var(--muted)]">
                  Paste the token from <Code>@BotFather</Code>, then click Validate.
                </p>
              </div>
            </div>

            {/* Token input */}
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => { setToken(e.target.value); setTokenError(""); setBotInfo(null); setWebhookInfo(null); }}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz…"
                className="input font-mono pr-32 text-sm"
                onKeyDown={(e) => { if (e.key === "Enter") validateToken(); }}
                spellCheck={false}
                autoComplete="off"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  aria-label={showToken ? "Hide token" : "Show token"}
                  className="text-[color:var(--muted)] hover:text-[color:var(--brand-navy)] transition p-1"
                >
                  <EyeIcon open={showToken} />
                </button>
                <button
                  type="button"
                  onClick={validateToken}
                  disabled={validating || !token.trim()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-[color:var(--brand-navy)] text-white px-3 py-1.5 rounded-md hover:opacity-90 disabled:opacity-40 transition"
                >
                  {validating ? (
                    <>
                      <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="40 60" />
                      </svg>
                      Checking…
                    </>
                  ) : "Validate"}
                </button>
              </div>
            </div>

            {tokenError && (
              <p className="text-sm text-red-600 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {tokenError}
              </p>
            )}

            {/* Bot info card */}
            {botInfo && (
              <div className="rounded-xl border border-[#0088cc]/30 bg-[#0088cc]/8 p-4 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0088cc] text-white font-bold text-lg shadow-sm">
                  {botInfo.first_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[color:var(--brand-navy)] truncate">{botInfo.first_name}</div>
                  <div className="text-sm text-[color:var(--muted)]">@{botInfo.username}</div>
                  <div className="text-xs text-[color:var(--muted)] mt-0.5">ID: {botInfo.id}</div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                  Token valid
                </span>
              </div>
            )}

            {/* Don't have a token yet */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-semibold text-[color:var(--brand-navy)] hover:text-[color:var(--brand-clay)] transition list-none flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="transition group-open:rotate-90">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Don&apos;t have a token yet?
              </summary>
              <div className="mt-3 pl-5 space-y-2 text-sm text-[color:var(--brand-navy)]/90">
                <p>1. Open Telegram and search <Code>@BotFather</Code></p>
                <p>2. Send the command <Code>/newbot</Code></p>
                <p>3. Choose a display name, then a username ending in <Code>bot</Code></p>
                <p>4. BotFather replies with your token — copy and paste it above.</p>
              </div>
            </details>
          </div>

          {/* ── STEP 2: Webhook ────────────────────────────────────── */}
          <div className={`card space-y-4 transition ${!botInfo ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="flex items-center gap-3">
              <StepBadge n={2} done={isWebhookHere} />
              <div>
                <h2 className="font-bold text-base">Register the webhook</h2>
                <p className="text-sm text-[color:var(--muted)]">
                  Tells Telegram where to POST customer messages.
                </p>
              </div>
            </div>

            {/* Webhook URL */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--muted)] mb-1.5">
                Your webhook URL
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-xs bg-[color:var(--brand-cream)] px-3 py-2.5 rounded-lg break-all border border-[color:var(--border)]">
                  {webhookUrl || "https://your-host/api/bots/telegram"}
                </div>
                <button
                  type="button"
                  onClick={() => copyText(webhookUrl, setCopiedUrl)}
                  className="shrink-0 text-xs font-bold px-3 py-2.5 rounded-lg border border-[color:var(--border)] hover:bg-[color:var(--brand-cream)] transition"
                  title="Copy URL"
                >
                  {copiedUrl ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </div>

            {/* Current webhook status */}
            {webhookInfo && webhookInfo.url && (
              <div className={`text-sm rounded-lg px-3.5 py-2.5 flex items-start gap-2 ${
                isWebhookHere
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
                  {isWebhookHere ? (
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <path d="M12 8v4M12 16h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  )}
                </svg>
                <span>
                  {isWebhookHere
                    ? "Webhook is registered and pointing to this server."
                    : <>Currently pointing to: <span className="font-mono break-all">{webhookInfo.url}</span></>
                  }
                </span>
              </div>
            )}

            {webhookInfo && webhookInfo.last_error_message && (
              <div className="text-sm rounded-lg px-3.5 py-2.5 bg-red-50 text-red-800 border border-red-200">
                ⚠ Last Telegram error: {webhookInfo.last_error_message}
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={registerWebhook}
                disabled={webhookBusy || isWebhookHere || !botInfo}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {webhookBusy && !isWebhookHere ? "Registering…" : isWebhookHere ? "Webhook registered ✓" : "Register Webhook"}
              </button>
              {isWebhookHere && (
                <button
                  type="button"
                  onClick={removeWebhook}
                  disabled={webhookBusy}
                  className="btn-outline text-sm"
                >
                  Remove Webhook
                </button>
              )}
            </div>

            {webhookMsg && (
              <p className={`text-sm flex items-center gap-2 ${webhookMsg.ok ? "text-green-700" : "text-red-600"}`}>
                {webhookMsg.ok ? "✓" : "✗"} {webhookMsg.text}
              </p>
            )}
          </div>

          {/* ── STEP 3: .env.local ─────────────────────────────────── */}
          <div className={`card space-y-3 transition ${!botInfo ? "opacity-50 pointer-events-none" : ""}`}>
            <div className="flex items-center gap-3">
              <StepBadge n={3} done={status?.telegram.configured} />
              <div>
                <h2 className="font-bold text-base">Save token to your environment</h2>
                <p className="text-sm text-[color:var(--muted)]">
                  The server webhook needs this to send replies.
                </p>
              </div>
            </div>

            <CodeBlock>{`TELEGRAM_BOT_TOKEN=${token || "YOUR_BOT_TOKEN_HERE"}`}</CodeBlock>

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-[color:var(--muted)] leading-relaxed">
                Add the above to <Code>akanadehye/.env.local</Code>, then restart{" "}
                <Code>npm run dev</Code>. The <strong>Active</strong> badge at the top will light up.
              </p>
              <button
                type="button"
                onClick={() => copyText(`TELEGRAM_BOT_TOKEN=${token}`, setCopiedEnv)}
                disabled={!token}
                className="shrink-0 text-xs font-bold px-3 py-2 rounded-lg border border-[color:var(--border)] hover:bg-[color:var(--brand-cream)] disabled:opacity-40 transition"
              >
                {copiedEnv ? "Copied ✓" : "Copy line"}
              </button>
            </div>

            {status?.telegram.configured && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3.5 py-2.5 text-sm text-green-800 font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
                </span>
                Token is live — bot is active.
              </div>
            )}
          </div>

          {/* Local polling (dev) */}
          <div className="card space-y-3">
            <h3 className="font-bold">Local development — polling mode</h3>
            <p className="text-sm text-[color:var(--muted)]">
              No public URL yet? Skip the webhook and run a polling script instead. It talks to the same bot brain.
            </p>
            <CodeBlock>{`# In the akanadehye/ folder:\nnode scripts/telegram-bot.mjs`}</CodeBlock>
            <p className="text-xs text-[color:var(--muted)]">
              Open your bot in Telegram and start chatting. Press <Code>Ctrl+C</Code> to stop.
            </p>
          </div>
        </div>

        {/* ── SIDEBAR ───────────────────────────────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          {/* Progress summary */}
          <div className="card !p-4 space-y-3">
            <h3 className="font-bold text-sm">Setup progress</h3>
            <div className="space-y-2">
              {[
                { label: "Token validated", done: !!botInfo },
                { label: "Webhook registered", done: isWebhookHere },
                { label: "Token saved to .env", done: !!status?.telegram.configured },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5 text-sm">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    s.done ? "bg-green-500 text-white" : "bg-[color:var(--border)] text-[color:var(--muted)]"
                  }`}>
                    {s.done ? "✓" : "·"}
                  </span>
                  <span className={s.done ? "text-[color:var(--brand-navy)] font-medium" : "text-[color:var(--muted)]"}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="card !p-4 bg-[color:var(--brand-cream)]">
            <h3 className="font-bold text-sm mb-2">Tips</h3>
            <ul className="text-xs space-y-1.5 text-[color:var(--muted)]">
              <li>• Telegram bots are free — no fees or verification</li>
              <li>• Use polling locally, webhook in production</li>
              <li>• Never commit your bot token to git</li>
              <li>• Test replies on the{" "}
                <a className="underline" href="/admin/chatbots/test">Test chat</a> page first
              </li>
              <li>• Change tone &amp; greeting on the{" "}
                <a className="underline" href="/admin/chatbots/persona">Persona</a> page
              </li>
            </ul>
          </div>

          {/* Webhook info panel */}
          {webhookInfo && (
            <div className="card !p-4">
              <h3 className="font-bold text-sm mb-3">Webhook details</h3>
              <dl className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[color:var(--muted)]">Pending updates</dt>
                  <dd className="font-semibold">{webhookInfo.pending_update_count}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-[color:var(--muted)]">Custom cert</dt>
                  <dd className="font-semibold">{webhookInfo.has_custom_certificate ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt className="text-[color:var(--muted)] mb-1">URL</dt>
                  <dd className="font-mono break-all bg-[color:var(--brand-cream)] p-2 rounded">
                    {webhookInfo.url || "—"}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
