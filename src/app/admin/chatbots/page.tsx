"use client";

import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import {
  ChannelCard,
  TELEGRAM_ICON,
  WHATSAPP_ICON,
  useBotStatus,
  type BotStatus,
} from "@/components/chatbots/shared";
import { usePersona } from "@/lib/botPersona";

export default function ChatbotsOverview() {
  const status = useBotStatus();
  const { persona } = usePersona();

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Engage" },
          { label: "Chatbots" },
        ]}
        title="Chatbots"
        subtitle="One brain, two channels. Answer product questions on WhatsApp and Telegram 24/7."
      />

      {/* Brain status banner */}
      <BrainBanner status={status} />

      {/* Status hero */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <ChannelCard
          name="Telegram"
          gradient="from-[#0088cc] to-[#005c8a]"
          configured={status?.telegram.configured ?? false}
          loading={status === null}
          detail={
            status?.telegram.configured
              ? `Token connected (${status.telegram.hint})`
              : "Token not set. Add TELEGRAM_BOT_TOKEN to .env.local."
          }
          iconPath={TELEGRAM_ICON}
          setupHref="/admin/chatbots/telegram"
        />
        <ChannelCard
          name="WhatsApp"
          gradient="from-[#25D366] to-[#128C7E]"
          configured={status?.whatsapp.configured ?? false}
          loading={status === null}
          detail={
            status?.whatsapp.configured
              ? status.whatsapp.twilio
                ? "Twilio credentials connected"
                : "Meta Cloud API connected"
              : "Twilio or Meta credentials not set."
          }
          iconPath={WHATSAPP_ICON}
          setupHref="/admin/chatbots/whatsapp"
        />
      </div>

      {/* Today at a glance */}
      <section className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Today at a glance</h2>
          <span className="text-xs text-[color:var(--muted)]">Live numbers will appear once bots are active.</span>
        </div>
        <div className="grid sm:grid-cols-4 gap-4">
          <Stat label="Conversations" value="0" sublabel="across both channels" />
          <Stat label="Messages handled" value="0" sublabel="by the bot brain" />
          <Stat label="Avg reply time" value="—" sublabel="bot is instant" />
          <Stat label="Handoffs to human" value="0" sublabel='triggered by "agent"' />
        </div>
      </section>

      {/* Quick links */}
      <section>
        <h2 className="font-bold text-lg mb-3">Manage</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink
            href="/admin/chatbots/test"
            title="Test the bot"
            body="Phone-frame chat to try replies before customers see them."
            accent="navy"
            iconPath="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
          />
          <QuickLink
            href="/admin/chatbots/persona"
            title="Persona"
            body={`Currently set to "${persona.tone}" tone for ${persona.shopName}.`}
            accent="gold"
            iconPath="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0"
          />
          <QuickLink
            href="/admin/chatbots/rate-limits"
            title="Rate limits"
            body="Live monitor of bot throttling — protects your Anthropic quota from spam."
            accent="navy"
            iconPath="M12 14l4-4M21 12a9 9 0 10-18 0 9 9 0 0018 0z"
          />
          <QuickLink
            href="/admin/chatbots/telegram"
            title="Telegram setup"
            body="Get a token from BotFather, paste, done."
            accent="teal"
            iconPath={TELEGRAM_ICON}
            fill
          />
          <QuickLink
            href="/admin/chatbots/whatsapp"
            title="WhatsApp setup"
            body="Twilio Sandbox for testing, Meta Cloud API for scale."
            accent="teal"
            iconPath={WHATSAPP_ICON}
            fill
          />
        </div>
      </section>

      {/* How it works */}
      <section className="card mt-8 bg-[color:var(--brand-cream)]/60">
        <h2 className="font-bold text-lg mb-2">How it works</h2>
        <ol className="space-y-2 text-sm text-[color:var(--brand-navy)]/90">
          <li>
            <strong>1.</strong> One shared brain ({" "}
            <Link href="/admin/chatbots/test" className="underline">
              test it here
            </Link>
            ) handles intent detection and product lookup.
          </li>
          <li>
            <strong>2.</strong> Each channel hits the same brain via a webhook — replies are identical across WhatsApp, Telegram, and the test chat.
          </li>
          <li>
            <strong>3.</strong> Your{" "}
            <Link href="/admin/chatbots/persona" className="underline">
              persona
            </Link>{" "}
            customises greetings, hours, and contact info without touching code.
          </li>
        </ol>
      </section>
    </div>
  );
}

function Stat({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-[color:var(--brand-navy)]">{value}</div>
      <div className="text-[10px] text-[color:var(--muted)] mt-0.5">{sublabel}</div>
    </div>
  );
}

function QuickLink({
  href,
  title,
  body,
  iconPath,
  accent,
  fill,
}: {
  href: string;
  title: string;
  body: string;
  iconPath: string;
  accent: "navy" | "gold" | "teal";
  fill?: boolean;
}) {
  const bg = {
    navy: "bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)]",
    gold: "bg-[color:var(--brand-gold)] text-[color:var(--brand-navy)]",
    teal: "bg-[color:var(--brand-teal)] text-white",
  }[accent];
  return (
    <Link
      href={href}
      className="card block hover:border-[color:var(--brand-navy)] !p-5 transition group"
    >
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"}>
          {fill ? (
            <path d={iconPath} />
          ) : (
            <path d={iconPath} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
      </span>
      <h3 className="mt-3 font-bold text-[color:var(--brand-navy)] group-hover:text-[color:var(--brand-clay)] transition">
        {title}
      </h3>
      <p className="mt-1 text-sm text-[color:var(--muted)]">{body}</p>
      <div className="mt-3 text-xs font-semibold text-[color:var(--brand-navy)]">Open →</div>
    </Link>
  );
}

function BrainBanner({ status }: { status: BotStatus | null }) {
  const loading = status === null;
  const claudeOn = status?.claude.configured ?? false;

  return (
    <div
      className={`mb-6 rounded-2xl border p-4 flex items-center justify-between gap-4 flex-wrap ${
        claudeOn
          ? "bg-gradient-to-r from-[color:var(--brand-navy)] to-[color:var(--brand-navy-soft)] border-[color:var(--brand-gold)]/30 text-white"
          : "bg-[color:var(--brand-cream)]/50 border-[color:var(--border)] text-[color:var(--brand-navy)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
            claudeOn ? "bg-[color:var(--brand-gold)] text-[color:var(--brand-navy)]" : "bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)]"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2a4 4 0 014 4v2a4 4 0 110 8v2a4 4 0 11-8 0v-2a4 4 0 110-8V6a4 4 0 014-4zM8 8h.01M16 8h.01M12 14h.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <div className="text-xs uppercase tracking-[0.15em] font-bold opacity-70">
            Brain
          </div>
          <div className="font-bold tracking-tight">
            {loading
              ? "Checking…"
              : claudeOn
              ? `Claude — ${status?.claude.model}`
              : "Pattern matching (fallback)"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {loading ? null : claudeOn ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/95 text-[color:var(--brand-navy)] px-2.5 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
            </span>
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
            Set ANTHROPIC_API_KEY to enable
          </span>
        )}
      </div>

      {!loading && (
        <p className={`text-xs basis-full leading-relaxed ${claudeOn ? "text-white/80" : "text-[color:var(--muted)]"}`}>
          {claudeOn
            ? "Customer messages are answered by Claude with live catalog lookup. The same brain powers Telegram, WhatsApp, and the test chat."
            : "Add ANTHROPIC_API_KEY to akanadehye/.env.local and restart the dev server to switch the brain to Claude. Until then the bot uses keyword matching."}
        </p>
      )}
    </div>
  );
}
