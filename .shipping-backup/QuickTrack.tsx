"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function QuickTrack() {
  const [code, setCode] = useState("");
  const router = useRouter();

  return (
    <div className="bg-white text-[color:var(--brand-navy)] rounded-2xl p-6 lg:p-7 shadow-2xl">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-clay)]">
        <span className="w-2 h-2 rounded-full bg-[color:var(--brand-clay)]" />
        Live Tracking
      </div>
      <h3 className="mt-2 text-2xl font-bold">Track your shipment</h3>
      <p className="mt-1 text-sm text-[color:var(--muted)]">
        Enter your AKD tracking number or bill of lading.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim())
            router.push(`/tracking?code=${encodeURIComponent(code.trim())}`);
        }}
        className="mt-5 flex flex-col gap-3"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. AKD-2026-1042"
          className="w-full px-4 py-3 rounded-lg border-2 border-[color:var(--border)] focus:border-[color:var(--brand-gold)] outline-none font-mono tracking-wider"
        />
        <button type="submit" className="btn-primary justify-center">
          Track shipment →
        </button>
      </form>

      <div className="mt-5 pt-5 border-t border-[color:var(--border)] flex items-center justify-between text-xs text-[color:var(--muted)]">
        <span>Try a sample:</span>
        <button
          onClick={() => {
            setCode("AKD-2026-1042");
            router.push("/tracking?code=AKD-2026-1042");
          }}
          className="font-mono font-semibold text-[color:var(--brand-clay)] hover:underline"
        >
          AKD-2026-1042
        </button>
      </div>
    </div>
  );
}
