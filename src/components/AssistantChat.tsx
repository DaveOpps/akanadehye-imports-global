"use client";

import { useEffect, useRef, useState } from "react";
import { SHIPPING_SPEEDS } from "@/lib/dates";

type Msg = { role: "user" | "assistant"; content: string };

/**
 * Render the assistant's markdown links and bold as React nodes.
 *
 * Built as elements rather than injected HTML — this text comes from a model
 * and must never be able to introduce markup. Only same-site paths and https
 * URLs are turned into links; anything else (javascript:, data:, ...) is left
 * as plain text.
 */
function renderRich(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  // [label](href) or **bold**
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));

    if (m[1] !== undefined && m[2] !== undefined) {
      const href = m[2];
      const safe = href.startsWith("/") || href.startsWith("https://");
      out.push(
        safe ? (
          <a
            key={key++}
            href={href}
            {...(href.startsWith("https://")
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="font-semibold underline underline-offset-2 text-[color:var(--brand-navy)] hover:text-[color:var(--brand-clay)]"
          >
            {m[1]}
          </a>
        ) : (
          m[1]
        )
      );
    } else if (m[3] !== undefined) {
      out.push(
        <strong key={key++} className="font-semibold">
          {m[3]}
        </strong>
      );
    }
    last = pattern.lastIndex;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

const SUGGESTIONS = [
  "How long will my order take?",
  "Do you have air fryers?",
  "How does pre-ordering work?",
];

const OPENER: Msg = {
  role: "assistant",
  content:
    `Hi! I'm the Akanadehye assistant. We're an import service — most items are brought in to order, ` +
    `${SHIPPING_SPEEDS.air.short} by air or ${SHIPPING_SPEEDS.sea.short} by sea. Ask me about a product, ` +
    `pricing or delivery times.`,
};

export default function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([OPENER]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(false);
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  // Escape closes the panel, matching how dialogs behave elsewhere.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const next = [...msgs, { role: "user" as const, content: trimmed }];
    setMsgs(next);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send prior turns only — the opener is local copy, not part of the
        // conversation the model needs.
        body: JSON.stringify({
          message: trimmed,
          history: next.slice(1, -1).slice(-10),
        }),
      });
      const data = await res.json();
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content: data.ok
            ? data.reply
            : data.error ?? "Sorry — something went wrong. Please try again.",
        },
      ]);
    } catch {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: "I couldn't reach the server. Check your connection and try again." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Akanadehye assistant"
          className="fixed z-50 bg-white shadow-2xl border border-[color:var(--border)] flex flex-col
                     inset-x-0 bottom-0 top-16 rounded-t-2xl
                     sm:inset-auto sm:bottom-40 sm:right-5 sm:top-auto sm:w-[370px] sm:h-[520px] sm:rounded-2xl"
        >
          <header className="flex items-center gap-2.5 px-4 py-3 bg-[color:var(--brand-navy)] text-white rounded-t-2xl shrink-0">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--brand-gold)] text-[color:var(--brand-navy)] font-bold">
              A
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm leading-tight">Akanadehye assistant</div>
              <div className="text-[11px] text-white/70 leading-tight">Imports &amp; pre-orders</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="p-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-[color:var(--brand-cream)]/40">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    m.role === "user"
                      ? "bg-[color:var(--brand-navy)] text-white rounded-br-sm"
                      : "bg-white border border-[color:var(--border)] text-[color:var(--brand-navy)] rounded-bl-sm"
                  }`}
                >
                  {m.role === "assistant" ? renderRich(m.content) : m.content}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex justify-start">
                <div className="bg-white border border-[color:var(--border)] rounded-2xl rounded-bl-sm px-3 py-2.5">
                  <span className="flex gap-1" aria-label="Assistant is typing">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-[color:var(--muted)] animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}

            {msgs.length === 1 && !busy && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[11px] px-2.5 py-1.5 rounded-full bg-white border border-[color:var(--border)] text-[color:var(--brand-navy)] hover:border-[color:var(--brand-navy)] transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="shrink-0 p-2.5 border-t border-[color:var(--border)] bg-white flex gap-2 rounded-b-2xl"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a product or delivery…"
              maxLength={2000}
              className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-[color:var(--border)] text-sm focus:outline-none focus:border-[color:var(--brand-navy)]"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send message"
              className="shrink-0 px-3 rounded-lg bg-[color:var(--brand-navy)] text-white disabled:opacity-40 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 12l16-8-6 8 6 8-16-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Launcher — sits above the WhatsApp button rather than on top of it */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        aria-expanded={open}
        className="fixed bottom-24 right-5 z-50 h-14 w-14 rounded-2xl bg-[color:var(--brand-navy)] text-white shadow-xl
                   flex items-center justify-center hover:scale-105 active:scale-95 transition"
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 11.5a8.5 8.5 0 01-11.9 7.8L3 21l1.7-5.6A8.5 8.5 0 1121 11.5z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {unread && !open && (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[color:var(--brand-gold)] ring-2 ring-white" />
        )}
      </button>
    </>
  );
}
