"use client";

import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { usePersona } from "@/lib/botPersona";

type ChatMsg = { id: number; from: "user" | "bot"; text: string };

const DEFAULT_QUICK_PROMPTS = [
  "Hi",
  "What categories do you have?",
  "Show me smartphones",
  "Price of iPhone",
  "Do you have perfumes?",
  "Talk to agent",
  "What are your hours?",
];

const CHAT_STORAGE_KEY = "akanadehye-test-chat-v1";
const PROMPTS_STORAGE_KEY = "akanadehye-quick-prompts-v1";

export default function TestChatPage() {
  const { persona, hydrated: personaHydrated } = usePersona();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState<string[]>(DEFAULT_QUICK_PROMPTS);
  const [editingPrompts, setEditingPrompts] = useState(false);
  const [newPrompt, setNewPrompt] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
      const saved = localStorage.getItem(PROMPTS_STORAGE_KEY);
      if (saved) setQuickPrompts(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(quickPrompts)); } catch {}
  }, [quickPrompts, hydrated]);

  function addPrompt() {
    const t = newPrompt.trim();
    if (!t || quickPrompts.includes(t)) return;
    setQuickPrompts((p) => [...p, t]);
    setNewPrompt("");
  }

  function removePrompt(idx: number) {
    setQuickPrompts((p) => p.filter((_, i) => i !== idx));
  }

  function movePrompt(idx: number, dir: -1 | 1) {
    setQuickPrompts((p) => {
      const next = [...p];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return next;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages, hydrated]);

  useEffect(() => {
    if (hydrated && personaHydrated && messages.length === 0) {
      setMessages([{ id: 0, from: "bot", text: persona.greeting + "\n\nAsk me anything." }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, personaHydrated]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    // Capture history BEFORE adding the new user message, send last 12 for context
    const history = messages.slice(-12).map((m) => ({
      role: (m.from === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.text,
    }));
    setMessages((m) => [...m, { id: Date.now(), from: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/bots/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, persona, history }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, from: "bot", text: data.reply?.text ?? "Sorry, something went wrong." },
      ]);
    } catch {
      setMessages((m) => [...m, { id: Date.now() + 1, from: "bot", text: "Network error — try again." }]);
    } finally {
      setBusy(false);
    }
  }

  function clearChat() {
    if (!confirm("Clear the test conversation?")) return;
    setMessages([{ id: 0, from: "bot", text: persona.greeting + "\n\nAsk me anything." }]);
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Engage" },
          { label: "Chatbots", href: "/admin/chatbots" },
          { label: "Test chat" },
        ]}
        title="Test chat"
        subtitle="Same brain as the live bots. Test replies, edge cases, and tone before customers see it."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] items-start">
        <div className="mx-auto w-full max-w-md">
          <div className="relative rounded-[2.2rem] bg-[color:var(--brand-navy)] p-2 shadow-2xl">
            <div className="absolute left-1/2 -translate-x-1/2 top-2 h-5 w-28 rounded-b-2xl bg-black/40 z-10" />
            <div className="rounded-[1.8rem] bg-white overflow-hidden flex flex-col h-[640px]">
              <div className="h-7 bg-[color:var(--brand-navy)] text-white text-[10px] font-semibold px-5 flex items-center justify-between">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <span>●●●</span>
                  <span>📶</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="px-4 py-3 bg-[color:var(--brand-navy)] text-white flex items-center gap-3 border-b border-black/10">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--brand-gold)] text-[color:var(--brand-navy)] font-bold">
                  {persona.shopName.charAt(0)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{persona.shopName} Bot</div>
                  <div className="text-[10px] text-white/70 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> online · replies in seconds
                  </div>
                </div>
                <button
                  onClick={clearChat}
                  aria-label="Clear conversation"
                  className="text-white/70 hover:text-white text-xs font-medium"
                >
                  Clear
                </button>
              </div>

              <div
                ref={scrollerRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-[color:var(--brand-cream)]/40"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at top left, rgba(212,169,81,0.06) 1px, transparent 1px), radial-gradient(circle at bottom right, rgba(10,22,40,0.04) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
              >
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
                        m.from === "user"
                          ? "bg-[color:var(--brand-navy)] text-white rounded-br-md"
                          : "bg-white text-[color:var(--brand-navy)] border border-[color:var(--border)] rounded-bl-md"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {busy && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-[color:var(--border)] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm shadow-sm">
                      <span className="inline-flex gap-1">
                        <Dot delay={0} /> <Dot delay={0.15} /> <Dot delay={0.3} />
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="p-3 border-t border-[color:var(--border)] flex gap-2 bg-white items-center"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 px-3 py-2 rounded-full bg-[color:var(--brand-cream)] text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-navy)]/30"
                  disabled={busy}
                />
                <button
                  disabled={busy || !input.trim()}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-[color:var(--brand-gold)] text-[color:var(--brand-navy)] hover:brightness-110 disabled:opacity-40 transition"
                  aria-label="Send"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">

          {/* ── Prompt composer ── */}
          <div className="card !p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-[color:var(--brand-navy)]">Your prompt</h3>
              {input.length > 0 && (
                <span className={`text-[10px] font-mono ${input.length > 400 ? "text-[color:var(--brand-clay)]" : "text-[color:var(--muted)]"}`}>
                  {input.length}/500
                </span>
              )}
            </div>
            <PromptTextarea
              value={input}
              onChange={setInput}
              onSend={() => send(input)}
              busy={busy}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-[color:var(--muted)]">
                Ctrl + Enter to send
              </span>
              <div className="flex gap-2">
                {input.trim() && (
                  <button
                    onClick={() => setInput("")}
                    className="text-xs text-[color:var(--muted)] hover:text-[color:var(--brand-navy)] transition"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => send(input)}
                  disabled={busy || !input.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[color:var(--brand-navy)] text-white text-xs font-bold hover:bg-[color:var(--brand-navy-soft)] disabled:opacity-40 transition"
                >
                  {busy ? (
                    <>
                      <span className="inline-flex gap-0.5">
                        <Dot delay={0} /><Dot delay={0.15} /><Dot delay={0.3} />
                      </span>
                      Sending
                    </>
                  ) : (
                    <>
                      Send
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── Quick prompts ── */}
          <div className="card !p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">Quick prompts</h3>
              <button
                onClick={() => setEditingPrompts((v) => !v)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                  editingPrompts
                    ? "bg-[color:var(--brand-navy)] text-white"
                    : "text-[color:var(--muted)] hover:text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)]"
                }`}
              >
                {editingPrompts ? "Done" : "Edit"}
              </button>
            </div>

            {editingPrompts ? (
              <div className="space-y-2">
                {quickPrompts.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 group">
                    {/* reorder arrows */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => movePrompt(idx, -1)}
                        disabled={idx === 0}
                        aria-label="Move up"
                        className="h-4 w-4 rounded flex items-center justify-center text-[color:var(--muted)] hover:text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)] disabled:opacity-20 transition"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                      <button
                        onClick={() => movePrompt(idx, 1)}
                        disabled={idx === quickPrompts.length - 1}
                        aria-label="Move down"
                        className="h-4 w-4 rounded flex items-center justify-center text-[color:var(--muted)] hover:text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)] disabled:opacity-20 transition"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>
                    <span className="flex-1 min-w-0 text-xs px-2.5 py-1.5 rounded-lg border border-[color:var(--border)] bg-[color:var(--brand-cream)]/50 truncate">
                      {p}
                    </span>
                    <button
                      onClick={() => removePrompt(idx)}
                      aria-label="Remove"
                      className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[color:var(--muted)] hover:bg-red-50 hover:text-red-500 transition"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                    </button>
                  </div>
                ))}

                {/* Add new */}
                <div className="flex gap-1.5 pt-1">
                  <input
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPrompt(); } }}
                    placeholder="New prompt…"
                    maxLength={120}
                    className="flex-1 min-w-0 text-xs px-2.5 py-1.5 rounded-lg border border-[color:var(--border)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-navy)]/20 focus:border-[color:var(--brand-navy)] bg-white"
                  />
                  <button
                    onClick={addPrompt}
                    disabled={!newPrompt.trim()}
                    className="shrink-0 h-7 w-7 rounded-lg bg-[color:var(--brand-gold)] text-[color:var(--brand-navy)] flex items-center justify-center font-bold text-base disabled:opacity-40 hover:brightness-110 transition"
                    aria-label="Add prompt"
                  >
                    +
                  </button>
                </div>

                {/* Reset */}
                <button
                  onClick={() => { if (confirm("Reset to default prompts?")) setQuickPrompts(DEFAULT_QUICK_PROMPTS); }}
                  className="text-[10px] text-[color:var(--muted)] hover:text-[color:var(--brand-clay)] transition mt-1"
                >
                  Reset to defaults
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    disabled={busy}
                    className="text-xs px-3 py-1.5 rounded-full border border-[color:var(--border)] hover:border-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)] transition disabled:opacity-50"
                  >
                    {p}
                  </button>
                ))}
                {quickPrompts.length === 0 && (
                  <p className="text-xs text-[color:var(--muted)]">No prompts yet. Click Edit to add some.</p>
                )}
              </div>
            )}
          </div>

          {/* ── Bot capabilities ── */}
          <div className="card !p-4 bg-[color:var(--brand-cream)]">
            <h3 className="font-bold text-sm mb-2">What the bot does</h3>
            <ul className="text-xs space-y-1.5 text-[color:var(--muted)]">
              <li>✓ Greets customers using your persona</li>
              <li>✓ Lists categories and searches products</li>
              <li>✓ Quotes prices, stock, and ratings</li>
              <li>✓ Shares hours and contact info</li>
              <li>✓ Hands off to a human on request</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PromptTextarea({
  value,
  onChange,
  onSend,
  busy,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  busy: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 240) + "px";
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value.slice(0, 500))}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          onSend();
        }
      }}
      disabled={busy}
      placeholder="Write a message or test scenario…&#10;&#10;e.g. Ask about bulk pricing for steel doors, or simulate a customer who wants to negotiate."
      rows={5}
      className="w-full px-3 py-2.5 rounded-xl border border-[color:var(--border)] focus:border-[color:var(--brand-navy)] text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-navy)]/20 resize-none bg-white placeholder:text-[color:var(--muted)]/70 leading-relaxed transition"
      style={{ minHeight: 100, overflowY: "hidden" }}
    />
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--brand-navy)]/60 animate-pulse"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}
