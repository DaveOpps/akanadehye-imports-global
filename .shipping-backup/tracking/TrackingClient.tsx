"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Shipment } from "@/lib/shipments";

export default function TrackingClient() {
  const params = useSearchParams();
  const initial = params.get("code") ?? "";
  const [code, setCode] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function lookup(c: string) {
    if (!c.trim()) return;
    setLoading(true);
    setError(null);
    setShipment(null);
    try {
      const res = await fetch(`/api/track?code=${encodeURIComponent(c.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed");
      setShipment(data.shipment);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initial) lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  return (
    <div className="max-w-5xl mx-auto px-5 lg:px-8 py-12 lg:py-16">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--brand-clay)]">
          Live Tracking
        </p>
        <h1 className="mt-2 text-4xl lg:text-5xl font-bold">
          Where is my shipment?
        </h1>
        <p className="mt-4 text-[color:var(--muted)]">
          Enter an AKD tracking number, bill of lading, or air waybill.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(code);
        }}
        className="mt-8 max-w-2xl mx-auto flex flex-col sm:flex-row gap-3"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="AKD-2026-XXXX"
          className="flex-1 px-5 py-4 rounded-lg border-2 border-[color:var(--border)] focus:border-[color:var(--brand-gold)] outline-none font-mono text-lg tracking-wider"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary justify-center min-w-44"
        >
          {loading ? "Searching…" : "Track →"}
        </button>
      </form>

      <div className="mt-4 text-center text-xs text-[color:var(--muted)]">
        Try samples:{" "}
        {["AKD-2026-1042", "AKD-2026-0921", "AKD-2025-7733"].map((s, i) => (
          <button
            key={s}
            onClick={() => {
              setCode(s);
              lookup(s);
            }}
            className="font-mono text-[color:var(--brand-clay)] hover:underline mx-1"
          >
            {s}
            {i < 2 ? "," : ""}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-10 max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl p-5 text-center">
          <div className="font-semibold text-red-700">{error}</div>
          <p className="text-sm text-red-600 mt-1">
            Double-check your tracking number, or{" "}
            <a href="/contact" className="underline">
              contact us
            </a>
            .
          </p>
        </div>
      )}

      {shipment && <ShipmentView shipment={shipment} />}
    </div>
  );
}

function ShipmentView({ shipment }: { shipment: Shipment }) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  return (
    <div className="mt-12 grid lg:grid-cols-3 gap-6">
      {/* Summary card */}
      <div className="lg:col-span-1 bg-[color:var(--brand-navy)] text-white rounded-2xl p-6">
        <div className="text-xs uppercase tracking-wider text-[color:var(--brand-gold)]">
          Tracking #
        </div>
        <div className="font-mono text-xl font-bold">
          {shipment.trackingNumber}
        </div>

        <div className="mt-5">
          <div className="text-xs text-white/60 uppercase tracking-wider">
            Current Status
          </div>
          <div className="text-2xl font-bold mt-1">{shipment.currentStatus}</div>
        </div>

        <div className="mt-5">
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[color:var(--brand-gold)] transition-all"
              style={{ width: `${shipment.progressPct}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-white/60">
            {shipment.progressPct}% complete
          </div>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <Info label="Mode" value={shipment.mode} />
          <Info label="Service" value={shipment.serviceLevel} />
          <Info label="Origin" value={shipment.origin} />
          <Info label="Destination" value={shipment.destination} />
          <Info label="Shipper" value={shipment.shipper} />
          <Info label="Consignee" value={shipment.consignee} />
          <Info label="Pieces" value={String(shipment.pieces)} />
          <Info label="Weight" value={`${shipment.weightKg.toLocaleString()} kg`} />
          {shipment.containerNo && (
            <Info label="Container" value={shipment.containerNo} mono />
          )}
          {shipment.vesselOrFlight && (
            <Info label="Vessel / Flight" value={shipment.vesselOrFlight} />
          )}
          <Info label="ETA" value={fmt(shipment.estimatedDelivery)} />
        </dl>
      </div>

      {/* Timeline */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-[color:var(--border)] p-6 lg:p-8">
        <h2 className="text-xl font-bold text-[color:var(--brand-navy)]">
          Shipment timeline
        </h2>
        <p className="text-sm text-[color:var(--muted)] mt-1">
          Most recent first.
        </p>

        <ol className="mt-6 relative border-l-2 border-[color:var(--border)] ml-3">
          {[...shipment.events].reverse().map((ev, i) => (
            <li key={i} className="ml-6 pb-7 last:pb-0 relative">
              <span
                className={`absolute -left-[34px] top-1 w-5 h-5 rounded-full border-4 ${
                  i === 0
                    ? "bg-[color:var(--brand-gold)] border-[color:var(--brand-navy)]"
                    : "bg-white border-[color:var(--brand-navy)]/30"
                }`}
              />
              <div className="font-semibold text-[color:var(--brand-navy)]">
                {ev.status}
              </div>
              <div className="text-sm text-[color:var(--muted)]">
                {ev.location} · {fmt(ev.timestamp)}
              </div>
              {ev.note && (
                <p className="mt-1 text-sm text-[color:var(--brand-navy)]/80 bg-[color:var(--brand-cream)] rounded-md px-3 py-2 inline-block">
                  {ev.note}
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-white/60">
        {label}
      </dt>
      <dd className={`mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
