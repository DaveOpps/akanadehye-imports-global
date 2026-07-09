"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/PageHeader";
import { formatPrice } from "@/lib/products";

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

  // chat
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    setCalculating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/tax-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "calculate",
          productDescription: productDescription.trim(),
          category: category.trim() || undefined,
          originCountry: originCountry.trim(),
          value: parseFloat(value) || 0,
          currency,
          exchangeRate: currency === "USD" ? parseFloat(exchangeRate) || undefined : undefined,
          freight: freight ? parseFloat(freight) : undefined,
          insurance: insurance ? parseFloat(insurance) : undefined,
          quantity: quantity ? parseInt(quantity) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error ?? "Calculation failed.");
      else setResult(data as Breakdown);
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

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="chip">HS guess: <strong className="ml-1 font-mono">{result.hsCodeGuess}</strong></span>
                {result.exchangeRateUsed && <span className="chip">FX: {result.exchangeRateUsed} GHS/USD</span>}
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
