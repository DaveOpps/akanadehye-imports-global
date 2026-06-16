"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { usePersona, DEFAULT_PERSONA } from "@/lib/botPersona";
import { Field } from "@/components/chatbots/shared";

export default function PersonaPage() {
  const { persona, setPersona, reset, hydrated } = usePersona();
  const [flash, setFlash] = useState(false);

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Engage" },
          { label: "Chatbots", href: "/admin/chatbots" },
          { label: "Persona" },
        ]}
        title="Persona"
        subtitle="How your bot greets customers, when you're open, and how to reach a human."
      />

      {!hydrated ? (
        <div className="text-sm text-[color:var(--muted)]">Loading persona…</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
          <div className="card space-y-5">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Shop name">
                <input
                  value={persona.shopName}
                  onChange={(e) => setPersona({ shopName: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Tone">
                <select
                  value={persona.tone}
                  onChange={(e) => setPersona({ tone: e.target.value as "formal" | "friendly" | "casual" })}
                  className="input"
                >
                  <option value="friendly">Friendly (default)</option>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                </select>
              </Field>
              <Field label="Welcome greeting" className="sm:col-span-2">
                <textarea
                  value={persona.greeting}
                  onChange={(e) => setPersona({ greeting: e.target.value })}
                  rows={3}
                  className="input resize-none"
                />
                <p className="text-[10px] text-[color:var(--muted)] mt-1">
                  Sent on first contact and when customers type &ldquo;hi&rdquo; or &ldquo;help&rdquo;.
                </p>
              </Field>
              <Field label="Business hours">
                <input
                  value={persona.hours}
                  onChange={(e) => setPersona({ hours: e.target.value })}
                  className="input"
                  placeholder="Mon–Sat 8am–8pm GMT"
                />
              </Field>
              <Field label="Contact phone">
                <input
                  value={persona.contactPhone}
                  onChange={(e) => setPersona({ contactPhone: e.target.value })}
                  className="input"
                  placeholder="+233 50 000 0000"
                />
              </Field>
              <Field label="Contact email" className="sm:col-span-2">
                <input
                  value={persona.contactEmail}
                  onChange={(e) => setPersona({ contactEmail: e.target.value })}
                  className="input"
                  placeholder="hello@akanadehye.com"
                />
              </Field>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[color:var(--border)]">
              <button
                onClick={() => {
                  if (confirm("Reset persona to defaults?")) reset();
                }}
                className="text-xs font-semibold text-[color:var(--brand-clay)] hover:underline"
              >
                Reset to defaults
              </button>
              <button
                onClick={() => {
                  setFlash(true);
                  setTimeout(() => setFlash(false), 1500);
                }}
                className="btn-gold text-sm"
              >
                {flash ? "✓ Saved" : "Save persona"}
              </button>
            </div>
            <p className="text-[10px] text-[color:var(--muted)]">
              Changes save automatically as you type — the &ldquo;Save&rdquo; button just confirms it.
            </p>
          </div>

          <aside className="card !p-5 bg-[color:var(--brand-cream)]">
            <h3 className="font-bold text-sm mb-3">Preview</h3>
            <div className="rounded-xl bg-white border border-[color:var(--border)] p-4 text-sm space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[color:var(--muted)] font-bold mb-1">
                  Greeting
                </div>
                <div className="text-[color:var(--brand-navy)] whitespace-pre-wrap">
                  {persona.greeting || DEFAULT_PERSONA.greeting}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[color:var(--muted)] font-bold mb-1">
                  When asked &ldquo;talk to agent&rdquo;
                </div>
                <div className="text-[color:var(--brand-navy)] space-y-0.5">
                  <div>📞 {persona.contactPhone}</div>
                  <div>✉️ {persona.contactEmail}</div>
                  <div>🕒 {persona.hours}</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
