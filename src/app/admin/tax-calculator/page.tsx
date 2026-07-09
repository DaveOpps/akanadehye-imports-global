"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/PageHeader";
import { formatPrice } from "@/lib/products";

type CalcInput = {
  productDescription: string;
  category?: string;
  originCountry: string;
  value: number;
  currency: "USD" | "GHS";
  exchangeRate?: number;
  freight?: number;
  insurance?: number;
  quantity?: number;
};

type SavedEstimate = {
  id: string;
  createdAt: string;
  createdBy: string | null;
  productDescription: string;
  originCountry: string;
  hsCodeGuess: string;
  customsValueGhs: number;
  totalTaxesGhs: number;
  totalLandedCostGhs: number;
  effectiveTaxRatePercent: number;
};

type LineItem = { label: string; ratePercent: number | null; amountGhs: number; note?: string };
type Breakdown = {
  ok: true;
  hsCodeGuess: string;
  customsValueGhs: number;
  exchangeRateUsed: number | null;
  lineItems: LineItem[];
  totalTaxesGhs: number;
  totalLandedCostGhs: number;
  effectiveTaxRatePercent: number;
  assumptions: string;
  disclaimer: string;
};
type ChatMsg = { role: "user" | "assistant"; content: string };

export default function TaxCalculatorPage() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isSuperAdmin = role === "super_admin";

  // form
  const [productDescription, setProductDescription] = useState("");
  const [category, setCategory] = useState("");
  const [originCountry, setOriginCountry] = useState("China");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState<"USD" | "GHS">("USD");
  const [exchangeRate, setExchangeRate] = useState("15.5");
  const [freight, setFreight] = useState("");
  const [insurance, setInsurance] = useState("");
  const [quantity, setQuantity] = useState("");

  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Breakdown | null>(null);
  const [lastInput, setLastInput] = useState<CalcInput | null>(null);

  // saved-estimate history
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [history, setHistory] = useState<SavedEstimate[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Prefill from a Sourcing order (?product=&value=&currency=&fx=&qty=&origin=&category=)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("product")) setProductDescription(p.get("product")!);
    if (p.get("category")) setCategory(p.get("category")!);
    if (p.get("origin")) setOriginCountry(p.get("origin")!);
    if (p.get("value")) setValue(p.get("value")!);
    if (p.get("currency") === "GHS" || p.get("currency") === "USD") setCurrency(p.get("currency") as "USD" | "GHS");
    if (p.get("fx")) setExchangeRate(p.get("fx")!);
    if (p.get("qty")) setQuantity(p.get("qty")!);
  }, []);

  async function loadHistory() {
    try {
      const res = await fetch("/api/admin/tax-calculator", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setHistory(data.estimates ?? []);
    } catch { /* ignore */ }
  }
  useEffect(() => { if (isSuperAdmin) loadHistory(); }, [isSuperAdmin]);

  async function saveEstimate() {
    if (!result || !lastInput) return;
    setSaving(true);
    setSavedMsg("");
    try {
      const res = await fetch("/api/admin/tax-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "save", input: lastInput, result }),
      });
      const data = await res.json();
      if (data.ok) { setSavedMsg("Saved ✓"); loadHistory(); }
      else setSavedMsg(data.error ?? "Save failed");
    } catch {
      setSavedMsg("Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(""), 2500);
    }
  }

  async function deleteEstimate(id: string) {
    setHistory((prev) => prev?.filter((e) => e.id !== id) ?? prev);
    try { await fetch(`/api/admin/tax-calculator/${id}`, { method: "DELETE" }); }
    catch { loadHistory(); }
  }

  // chat
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    setCalculating(true);
    setError("");
    setSavedMsg("");
    const input: CalcInput = {
      productDescription: productDescription.trim(),
      category: category.trim() || undefined,
      originCountry: originCountry.trim(),
      value: parseFloat(value) || 0,
      currency,
      exchangeRate: currency === "USD" ? parseFloat(exchangeRate) || undefined : undefined,
      freight: freight ? parseFloat(freight) : undefined,
      insurance: insurance ? parseFloat(insurance) : undefined,
      quantity: quantity ? parseInt(quantity) : undefined,
    };
    try {
      const res = await fetch("/api/admin/tax-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "calculate", ...input }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "Calculation failed.");
      else { setResult(data as Breakdown); setLastInput(input); }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setCalculating(false);
    }
  }

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || chatBusy) return;
    const next = [...chat, { role: "user" as const, content: text }];
    setChat(next);
    setChatInput("");
    setChatBusy(true);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    try {
      const res = await fetch("/api/admin/tax-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "chat", messages: next, context: result }),
      });
      const data = await res.json();
      setChat([...next, { role: "assistant", content: data.reply ?? data.error ?? "No answer." }]);
    } catch {
      setChat([...next, { role: "assistant", content: "Network error — please try again." }]);
    } finally {
      setChatBusy(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  if (status === "loading") {
    return <div className="p-8 text-sm text-[color:var(--muted)]">Loading…</div>;
  }

  if (!isSuperAdmin) {
    return (
      <div>
        <PageHeader
          breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Finance" }, { label: "Tax Calculator" }]}
          title="Import Tax Calculator"
          subtitle="Private tool"
        />
        <div className="card border-[color:var(--brand-clay)]/30 bg-[color:var(--brand-clay)]/[0.03]">
          <p className="text-sm text-[color:var(--brand-navy)]">
            🔒 This calculator is private to the <strong>super admin</strong>. Ask the account owner if you need access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[{ label: "Dashboard", href: "/admin" }, { label: "Finance" }, { label: "Tax Calculator" }]}
        title="Import Tax Calculator"
        subtitle="Estimate Ghana import duties & levies on sourced products — powered by a Claude tax assistant. Private to the super admin."
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* ── Form ── */}
        <form onSubmit={calculate} className="card space-y-4 lg:sticky lg:top-20 lg:self-start">
          <h2 className="font-bold text-base text-[color:var(--brand-navy)]">Product & shipment</h2>

          <Field label="What is the product?">
            <textarea
              required value={productDescription} onChange={(e) => setProductDescription(e.target.value)}
              rows={2} className="input resize-y" placeholder="e.g. Corn sheller machine, diesel powered"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category (optional)">
              <input value={category} onChange={(e) => setCategory(e.target.value)} className="input" placeholder="Agricultural Machinery" />
            </Field>
            <Field label="Country of origin">
              <input required value={originCountry} onChange={(e) => setOriginCountry(e.target.value)} className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Product value">
              <input required type="number" step="0.01" min="0" value={value} onChange={(e) => setValue(e.target.value)} className="input" placeholder="0.00" />
            </Field>
            <Field label="Currency">
              <select value={currency} onChange={(e) => setCurrency(e.target.value as "USD" | "GHS")} className="input">
                <option value="USD">USD ($)</option>
                <option value="GHS">GHS (₵)</option>
              </select>
            </Field>
          </div>

          {currency === "USD" && (
            <Field label="Exchange rate (GHS per USD)">
              <input type="number" step="0.01" min="1" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className="input" />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Freight (${currency}, optional)`}>
              <input type="number" step="0.01" min="0" value={freight} onChange={(e) => setFreight(e.target.value)} className="input" placeholder="0.00" />
            </Field>
            <Field label={`Insurance (${currency}, optional)`}>
              <input type="number" step="0.01" min="0" value={insurance} onChange={(e) => setInsurance(e.target.value)} className="input" placeholder="0.00" />
            </Field>
          </div>

          <Field label="Quantity (optional)">
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input" placeholder="1" />
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={calculating} className="btn-gold w-full justify-center disabled:opacity-60">
            {calculating ? "Estimating…" : "Calculate taxes"}
          </button>
        </form>

        {/* ── Results + chat ── */}
        <div className="space-y-6 min-w-0">
          {!result ? (
            <div className="card text-center py-12">
              <div className="mx-auto h-12 w-12 rounded-full bg-[color:var(--brand-cream)] flex items-center justify-center text-[color:var(--brand-navy)] mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 6h8M8 10h2M8 14h2M14 10h2M14 14h2M8 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <p className="font-semibold text-[color:var(--brand-navy)]">Enter a product and hit Calculate</p>
              <p className="text-sm text-[color:var(--muted)] mt-1">The assistant estimates duty, VAT and GRA levies, then you can ask it anything.</p>
            </div>
          ) : (
            <div className="card space-y-5">
              {/* Headline */}
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[color:var(--muted)] font-semibold">Total taxes & levies</div>
                  <div className="text-3xl font-bold text-[color:var(--brand-navy)]">{formatPrice(result.totalTaxesGhs)}</div>
                  <div className="text-xs text-[color:var(--muted)] mt-0.5">≈ {result.effectiveTaxRatePercent.toFixed(1)}% of CIF value</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-[color:var(--muted)] font-semibold">Total landed cost</div>
                  <div className="text-2xl font-bold text-[color:var(--brand-gold)]">{formatPrice(result.totalLandedCostGhs)}</div>
                  <div className="text-xs text-[color:var(--muted)] mt-0.5">CIF {formatPrice(result.customsValueGhs)}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="chip">HS guess: <strong className="ml-1 font-mono">{result.hsCodeGuess}</strong></span>
                {result.exchangeRateUsed && <span className="chip">FX: {result.exchangeRateUsed} GHS/USD</span>}
                <button
                  type="button"
                  onClick={saveEstimate}
                  disabled={saving}
                  className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-[color:var(--brand-navy)] text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)] disabled:opacity-50 transition"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {savedMsg || (saving ? "Saving…" : "Save estimate")}
                </button>
              </div>

              {/* Line items */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wider text-[color:var(--muted)] border-b border-[color:var(--border)]">
                      <th className="pb-2 font-semibold">Component</th>
                      <th className="pb-2 font-semibold text-right">Rate</th>
                      <th className="pb-2 font-semibold text-right">Amount (GHS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.lineItems.map((li, i) => (
                      <tr key={i} className="border-b border-[color:var(--border)]/50 last:border-0">
                        <td className="py-2">
                          <div className="font-medium text-[color:var(--brand-navy)]">{li.label}</div>
                          {li.note && <div className="text-[11px] text-[color:var(--muted)]">{li.note}</div>}
                        </td>
                        <td className="py-2 text-right text-[color:var(--muted)] tabular-nums">
                          {li.ratePercent != null ? `${li.ratePercent}%` : "—"}
                        </td>
                        <td className="py-2 text-right font-semibold tabular-nums">{formatPrice(li.amountGhs)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-[color:var(--border)]">
                      <td className="pt-2 font-bold">Total taxes</td>
                      <td></td>
                      <td className="pt-2 text-right font-bold text-[color:var(--brand-navy)] tabular-nums">{formatPrice(result.totalTaxesGhs)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {result.assumptions && (
                <div className="rounded-lg bg-[color:var(--brand-cream)]/50 px-3.5 py-2.5 text-xs text-[color:var(--brand-navy)]/90">
                  <span className="font-semibold">Assumptions: </span>{result.assumptions}
                </div>
              )}
              <p className="text-[11px] text-[color:var(--muted)] italic">{result.disclaimer}</p>
            </div>
          )}

          {/* Chat / brain */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2a4 4 0 014 4v2a4 4 0 110 8v2a4 4 0 11-8 0v-2a4 4 0 110-8V6a4 4 0 014-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-sm text-[color:var(--brand-navy)]">Ask the tax assistant</h3>
                <p className="text-[11px] text-[color:var(--muted)]">e.g. &ldquo;Is there a duty waiver for agricultural machinery?&rdquo;</p>
              </div>
            </div>

            {chat.length > 0 && (
              <div className="max-h-80 overflow-y-auto space-y-3 rounded-lg bg-[color:var(--brand-cream)]/30 p-3">
                {chat.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-[color:var(--brand-navy)] text-white"
                        : "bg-white border border-[color:var(--border)] text-[color:var(--brand-navy)]"
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatBusy && <div className="text-xs text-[color:var(--muted)]">Assistant is thinking…</div>}
                <div ref={chatEndRef} />
              </div>
            )}

            <form onSubmit={sendChat} className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about duty rates, HS codes, exemptions…"
                className="input flex-1"
              />
              <button type="submit" disabled={chatBusy || !chatInput.trim()} className="btn-primary shrink-0 disabled:opacity-40">
                Send
              </button>
            </form>
          </div>

          {/* Saved estimates */}
          <div className="card">
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <h3 className="font-bold text-sm text-[color:var(--brand-navy)]">
                Saved estimates {history && history.length > 0 && <span className="text-[color:var(--muted)] font-normal">({history.length})</span>}
              </h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`transition ${showHistory ? "rotate-180" : ""}`}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {showHistory && (
              <div className="mt-3">
                {!history ? (
                  <p className="text-sm text-[color:var(--muted)]">Loading…</p>
                ) : history.length === 0 ? (
                  <p className="text-sm text-[color:var(--muted)] py-3 text-center">No saved estimates yet. Calculate one, then hit &ldquo;Save estimate&rdquo;.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[10px] uppercase tracking-wider text-[color:var(--muted)] border-b border-[color:var(--border)]">
                          <th className="pb-2 font-semibold">Product · Date</th>
                          <th className="pb-2 font-semibold">HS</th>
                          <th className="pb-2 font-semibold text-right">Taxes</th>
                          <th className="pb-2 font-semibold text-right">Landed</th>
                          <th className="pb-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((e) => (
                          <tr key={e.id} className="border-b border-[color:var(--border)]/50 last:border-0">
                            <td className="py-2">
                              <div className="font-medium text-[color:var(--brand-navy)] max-w-[200px] truncate" title={e.productDescription}>{e.productDescription}</div>
                              <div className="text-[11px] text-[color:var(--muted)]">
                                {new Date(e.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {e.originCountry}
                              </div>
                            </td>
                            <td className="py-2 font-mono text-[11px] text-[color:var(--muted)]">{e.hsCodeGuess}</td>
                            <td className="py-2 text-right font-semibold tabular-nums">{formatPrice(e.totalTaxesGhs)}</td>
                            <td className="py-2 text-right tabular-nums">{formatPrice(e.totalLandedCostGhs)}</td>
                            <td className="py-2 text-right">
                              <button onClick={() => deleteEstimate(e.id)} className="text-[11px] font-semibold text-red-600 hover:text-red-800">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      {children}
    </label>
  );
}
