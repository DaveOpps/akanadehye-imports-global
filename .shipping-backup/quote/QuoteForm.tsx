"use client";
import { useState } from "react";

type Mode = "Ocean" | "Air" | "Road";

type Form = {
  mode: Mode;
  service: string;
  originCity: string;
  originCountry: string;
  destCity: string;
  destCountry: string;
  weightKg: string;
  volumeCbm: string;
  pieces: string;
  cargoType: string;
  description: string;
  pickupReady: string;
  incoterm: string;
  insurance: boolean;
  contactName: string;
  contactCompany: string;
  contactEmail: string;
  contactPhone: string;
};

const empty: Form = {
  mode: "Ocean",
  service: "FCL 20'",
  originCity: "",
  originCountry: "",
  destCity: "",
  destCountry: "",
  weightKg: "",
  volumeCbm: "",
  pieces: "1",
  cargoType: "General Cargo",
  description: "",
  pickupReady: "",
  incoterm: "FOB",
  insurance: true,
  contactName: "",
  contactCompany: "",
  contactEmail: "",
  contactPhone: "",
};

type Result = {
  reference: string;
  estimateUSD: number;
  estimatedTransit: string;
  nextSteps: string;
};

export default function QuoteForm() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          weightKg: Number(form.weightKg),
          volumeCbm: form.volumeCbm ? Number(form.volumeCbm) : undefined,
          pieces: Number(form.pieces),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="bg-white rounded-2xl border border-[color:var(--border)] p-8 lg:p-10">
        <div className="w-14 h-14 rounded-full bg-[color:var(--brand-gold)] flex items-center justify-center text-2xl">
          ✓
        </div>
        <h2 className="mt-5 text-3xl font-bold text-[color:var(--brand-navy)]">
          Quote received.
        </h2>
        <p className="mt-2 text-[color:var(--muted)]">
          Reference{" "}
          <span className="font-mono font-bold text-[color:var(--brand-navy)]">
            {result.reference}
          </span>
          . Save this for your records.
        </p>

        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          <div className="bg-[color:var(--brand-cream)] rounded-xl p-5">
            <div className="text-xs uppercase tracking-wider text-[color:var(--brand-clay)]">
              Indicative estimate
            </div>
            <div className="mt-1 text-3xl font-bold text-[color:var(--brand-navy)]">
              ~ USD {result.estimateUSD.toLocaleString()}
            </div>
            <div className="text-xs text-[color:var(--muted)] mt-1">
              Final pricing in 24 hours
            </div>
          </div>
          <div className="bg-[color:var(--brand-cream)] rounded-xl p-5">
            <div className="text-xs uppercase tracking-wider text-[color:var(--brand-clay)]">
              Estimated transit
            </div>
            <div className="mt-1 text-3xl font-bold text-[color:var(--brand-navy)]">
              {result.estimatedTransit}
            </div>
            <div className="text-xs text-[color:var(--muted)] mt-1">
              Door-to-door
            </div>
          </div>
        </div>

        <p className="mt-6 text-sm text-[color:var(--muted)]">
          {result.nextSteps}
        </p>

        <button
          onClick={() => {
            setForm(empty);
            setStep(1);
            setResult(null);
          }}
          className="mt-8 btn-outline"
        >
          ← Submit another quote
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[color:var(--border)] p-7 lg:p-9">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-7">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s
                  ? "bg-[color:var(--brand-navy)] text-[color:var(--brand-gold)]"
                  : "bg-[color:var(--border)] text-[color:var(--muted)]"
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  step > s
                    ? "bg-[color:var(--brand-navy)]"
                    : "bg-[color:var(--border)]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Step title="Shipment basics" sub="What's moving and how?">
          <Field label="Transport mode">
            <div className="grid grid-cols-3 gap-2">
              {(["Ocean", "Air", "Road"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set("mode", m)}
                  className={`py-3 rounded-lg font-semibold border-2 transition ${
                    form.mode === m
                      ? "border-[color:var(--brand-gold)] bg-[color:var(--brand-cream)] text-[color:var(--brand-navy)]"
                      : "border-[color:var(--border)] text-[color:var(--muted)] hover:border-[color:var(--brand-navy)]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Service level">
            <select
              value={form.service}
              onChange={(e) => set("service", e.target.value)}
              className={inputCls}
            >
              {form.mode === "Ocean" && (
                <>
                  <option>FCL 20&apos;</option>
                  <option>FCL 40&apos;</option>
                  <option>FCL 40&apos; HQ</option>
                  <option>LCL (Less than Container)</option>
                  <option>Reefer (Refrigerated)</option>
                </>
              )}
              {form.mode === "Air" && (
                <>
                  <option>Standard Air</option>
                  <option>Express Air (24–72h)</option>
                  <option>Perishable / Cold-Chain</option>
                  <option>Dangerous Goods</option>
                </>
              )}
              {form.mode === "Road" && (
                <>
                  <option>Full Truck Load</option>
                  <option>Less than Truck Load</option>
                  <option>Refrigerated Truck</option>
                </>
              )}
            </select>
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Pieces">
              <input
                type="number"
                min="1"
                value={form.pieces}
                onChange={(e) => set("pieces", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Total weight (kg)">
              <input
                type="number"
                min="0"
                value={form.weightKg}
                onChange={(e) => set("weightKg", e.target.value)}
                placeholder="e.g. 1500"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Volume (CBM, optional)">
            <input
              type="number"
              step="0.1"
              value={form.volumeCbm}
              onChange={(e) => set("volumeCbm", e.target.value)}
              placeholder="e.g. 4.2"
              className={inputCls}
            />
          </Field>

          <NavButtons
            onNext={() => setStep(2)}
            nextDisabled={!form.weightKg || !form.pieces}
          />
        </Step>
      )}

      {step === 2 && (
        <Step title="Route & cargo" sub="Where from, where to, and what is it?">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Origin city">
              <input
                value={form.originCity}
                onChange={(e) => set("originCity", e.target.value)}
                placeholder="Shanghai"
                className={inputCls}
              />
            </Field>
            <Field label="Origin country">
              <input
                value={form.originCountry}
                onChange={(e) => set("originCountry", e.target.value)}
                placeholder="China"
                className={inputCls}
              />
            </Field>
            <Field label="Destination city">
              <input
                value={form.destCity}
                onChange={(e) => set("destCity", e.target.value)}
                placeholder="Tema"
                className={inputCls}
              />
            </Field>
            <Field label="Destination country">
              <input
                value={form.destCountry}
                onChange={(e) => set("destCountry", e.target.value)}
                placeholder="Ghana"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Cargo type">
              <select
                value={form.cargoType}
                onChange={(e) => set("cargoType", e.target.value)}
                className={inputCls}
              >
                <option>General Cargo</option>
                <option>Electronics</option>
                <option>Auto Parts / Vehicles</option>
                <option>Machinery</option>
                <option>Apparel / Textiles</option>
                <option>Food / Beverages</option>
                <option>Perishable / Pharma</option>
                <option>Hazardous (DG)</option>
                <option>Building Materials</option>
                <option>Personal Effects</option>
              </select>
            </Field>
            <Field label="Incoterm">
              <select
                value={form.incoterm}
                onChange={(e) => set("incoterm", e.target.value)}
                className={inputCls}
              >
                <option>EXW</option>
                <option>FOB</option>
                <option>CIF</option>
                <option>DAP</option>
                <option>DDP</option>
                <option>Not sure</option>
              </select>
            </Field>
          </div>

          <Field label="Cargo description (optional)">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Brand, model, condition, packaging notes…"
              className={inputCls}
            />
          </Field>

          <Field label="Pickup ready date">
            <input
              type="date"
              value={form.pickupReady}
              onChange={(e) => set("pickupReady", e.target.value)}
              className={inputCls}
            />
          </Field>

          <label className="flex items-center gap-3 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.insurance}
              onChange={(e) => set("insurance", e.target.checked)}
              className="w-5 h-5"
            />
            <span className="text-sm text-[color:var(--brand-navy)]">
              Add cargo insurance (recommended)
            </span>
          </label>

          <NavButtons
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            nextDisabled={
              !form.originCity ||
              !form.originCountry ||
              !form.destCity ||
              !form.destCountry
            }
          />
        </Step>
      )}

      {step === 3 && (
        <Step title="Your contact details" sub="Where should we send the quote?">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Full name">
              <input
                value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
                placeholder="Akosua Mensah"
                className={inputCls}
              />
            </Field>
            <Field label="Company (optional)">
              <input
                value={form.contactCompany}
                onChange={(e) => set("contactCompany", e.target.value)}
                placeholder="Mensa Foods Ltd"
                className={inputCls}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                placeholder="you@company.com"
                className={inputCls}
              />
            </Field>
            <Field label="Phone (with country code)">
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
                placeholder="+233 50 000 0000"
                className={inputCls}
              />
            </Field>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <NavButtons
            onBack={() => setStep(2)}
            onNext={submit}
            nextLabel={submitting ? "Submitting…" : "Submit quote request"}
            nextDisabled={
              submitting ||
              !form.contactName ||
              !form.contactEmail ||
              !form.contactPhone
            }
          />
        </Step>
      )}
    </div>
  );
}

const inputCls =
  "w-full px-4 py-3 rounded-lg border-2 border-[color:var(--border)] focus:border-[color:var(--brand-gold)] outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-[color:var(--brand-navy)] mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Step({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[color:var(--brand-navy)]">
          {title}
        </h2>
        <p className="text-sm text-[color:var(--muted)]">{sub}</p>
      </div>
      {children}
    </div>
  );
}

function NavButtons({
  onBack,
  onNext,
  nextLabel = "Continue →",
  nextDisabled,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="flex justify-between pt-4 border-t border-[color:var(--border)] mt-6">
      {onBack ? (
        <button type="button" onClick={onBack} className="btn-outline">
          ← Back
        </button>
      ) : (
        <div />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {nextLabel}
      </button>
    </div>
  );
}
