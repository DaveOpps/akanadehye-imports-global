"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartContext";
import { useCheckoutDraft, type ShippingAddress } from "@/lib/orders";

const COUNTRIES = ["Ghana", "Nigeria", "Côte d'Ivoire", "Togo", "Burkina Faso", "United Kingdom", "United States", "Other"];
const REGIONS_GH = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Eastern",
  "Central",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Bono",
  "Bono East",
  "Ahafo",
  "Western North",
  "Oti",
  "Savannah",
  "North East",
];

export default function AddressStep() {
  const router = useRouter();
  const { items } = useCart();
  const { draft, setDraft, hydrated } = useCheckoutDraft();

  const [form, setForm] = useState<Partial<ShippingAddress>>({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    region: "Greater Accra",
    country: "Ghana",
    notes: "",
  });

  // Hydrate form from saved draft
  useEffect(() => {
    if (hydrated && draft.address) {
      setForm((f) => ({ ...f, ...draft.address }));
    }
  }, [hydrated, draft.address]);

  // Redirect if cart empty
  useEffect(() => {
    if (hydrated && items.length === 0) {
      router.replace("/cart");
    }
  }, [hydrated, items.length, router]);

  function update<K extends keyof ShippingAddress>(key: K, value: ShippingAddress[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setDraft({ address: form });
    router.push("/checkout/payment");
  }

  return (
    <form onSubmit={submit} className="grid lg:grid-cols-[1fr_320px] gap-8">
      <div className="card space-y-5">
        <h2 className="font-bold text-lg">Shipping address</h2>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Full name" required>
            <input
              required
              value={form.fullName ?? ""}
              onChange={(e) => update("fullName", e.target.value)}
              className="input"
              autoComplete="name"
            />
          </Field>
          <Field label="Phone" required>
            <input
              required
              type="tel"
              value={form.phone ?? ""}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+233 50 000 0000"
              className="input"
              autoComplete="tel"
            />
          </Field>
          <Field label="Email" required className="sm:col-span-2">
            <input
              required
              type="email"
              value={form.email ?? ""}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
              className="input"
              autoComplete="email"
            />
          </Field>
          <Field label="Street address" required className="sm:col-span-2">
            <input
              required
              value={form.address ?? ""}
              onChange={(e) => update("address", e.target.value)}
              placeholder="House number, street, neighborhood"
              className="input"
              autoComplete="street-address"
            />
          </Field>
          <Field label="City" required>
            <input
              required
              value={form.city ?? ""}
              onChange={(e) => update("city", e.target.value)}
              className="input"
              autoComplete="address-level2"
            />
          </Field>
          <Field label="Region / State" required>
            {form.country === "Ghana" ? (
              <select
                value={form.region ?? ""}
                onChange={(e) => update("region", e.target.value)}
                className="input"
              >
                {REGIONS_GH.map((r) => <option key={r}>{r}</option>)}
              </select>
            ) : (
              <input
                required
                value={form.region ?? ""}
                onChange={(e) => update("region", e.target.value)}
                className="input"
                autoComplete="address-level1"
              />
            )}
          </Field>
          <Field label="Country" required className="sm:col-span-2">
            <select
              value={form.country ?? "Ghana"}
              onChange={(e) => update("country", e.target.value)}
              className="input"
              autoComplete="country-name"
            >
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Delivery notes (optional)" className="sm:col-span-2">
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => update("notes", e.target.value)}
              rows={2}
              placeholder="Landmarks, gate codes, preferred time, etc."
              className="input resize-none"
            />
          </Field>
        </div>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="card">
          <h3 className="font-bold mb-3">Cart ({items.length})</h3>
          <ul className="text-sm space-y-1.5 max-h-64 overflow-y-auto">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span className="truncate">{i.quantity}× {i.title}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 flex gap-2">
          <Link href="/cart" className="btn-outline text-sm flex-1 justify-center">
            ← Cart
          </Link>
          <button className="btn-gold text-sm flex-1 justify-center">
            Continue →
          </button>
        </div>
      </aside>
    </form>
  );
}

function Field({
  label,
  children,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-sm font-medium mb-1.5">
        {label} {required && <span className="text-[color:var(--brand-clay)]">*</span>}
      </span>
      {children}
    </label>
  );
}
