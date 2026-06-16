"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/lib/settings";
import PageHeader from "@/components/PageHeader";

export default function SettingsPage() {
  const { settings, save, hydrated } = useSettings();
  const [saved, setSaved] = useState(false);

  const [rate, setRate] = useState(settings.exchangeRate.toString());
  const [currency, setCurrency] = useState<"GHS" | "USD">(settings.defaultCurrency);
  const [lowStockDefault, setLowStockDefault] = useState(
    settings.lowStockDefault.toString()
  );

  // Sync form fields once localStorage hydrates
  useEffect(() => {
    if (hydrated) {
      setRate(settings.exchangeRate.toString());
      setCurrency(settings.defaultCurrency);
      setLowStockDefault(settings.lowStockDefault.toString());
    }
  }, [hydrated, settings]);

  function handleSave() {
    save({
      exchangeRate: parseFloat(rate) || 15.5,
      defaultCurrency: currency,
      lowStockDefault: parseInt(lowStockDefault) || 5,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function clearAllData() {
    if (
      !confirm(
        "Clear ALL demo data from this browser?\n\nProducts, orders, payments, invoices, and settings will be permanently removed. This cannot be undone."
      )
    )
      return;
    const keys = [
      "akanadehye-payments-v1",
      "akanadehye-inventory-v1",
      "akanadehye-invoices-v1",
      "akanadehye-sourcing-v1",
      "akanadehye-financing-v1",
      "akanadehye-orders-v1",
      "akanadehye-cart-v1",
      "akanadehye-saved-v1",
      "akanadehye-settings-v1",
      "akanadehye-checkout-draft-v1",
      "akanadehye-auth-v1",
    ];
    for (const k of keys) localStorage.removeItem(k);
    window.location.replace("/login");
  }

  return (
    <div>
      <PageHeader
        breadcrumb={[
          { label: "Dashboard", href: "/admin" },
          { label: "Admin" },
          { label: "Settings" },
        ]}
        title="Settings"
        subtitle="Configure display preferences and dashboard defaults."
      />

      {/* Currency & Exchange Rate */}
      <div className="card mb-4">
        <h2 className="font-bold text-base mb-4 text-[color:var(--brand-navy)]">
          Currency &amp; Exchange Rate
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">
              Display currency
            </span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "GHS" | "USD")}
              className="input"
            >
              <option value="GHS">GHS — Ghana Cedis (₵)</option>
              <option value="USD">USD — US Dollars ($)</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">
              GHS per USD (exchange rate)
            </span>
            <input
              type="number"
              step="0.01"
              min="1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="input"
              placeholder="e.g. 15.50"
            />
            <span className="block text-xs text-[color:var(--muted)] mt-1">
              Used to convert sourcing costs from USD to GHS.
            </span>
          </label>
        </div>
      </div>

      {/* Inventory Defaults */}
      <div className="card mb-6">
        <h2 className="font-bold text-base mb-4 text-[color:var(--brand-navy)]">
          Inventory Defaults
        </h2>
        <label className="block max-w-xs">
          <span className="block text-sm font-medium mb-1.5">
            Default reorder level for new products
          </span>
          <input
            type="number"
            min="0"
            value={lowStockDefault}
            onChange={(e) => setLowStockDefault(e.target.value)}
            className="input"
          />
          <span className="block text-xs text-[color:var(--muted)] mt-1">
            Products at or below this stock level are flagged as <strong>Low</strong>.
          </span>
        </label>
      </div>

      <button
        onClick={handleSave}
        className="btn-primary mb-10"
      >
        {saved ? "✓ Saved" : "Save settings"}
      </button>

      {/* Danger Zone */}
      <div className="rounded-xl border border-[color:var(--brand-clay)]/30 bg-[color:var(--brand-clay)]/[0.03] p-5">
        <h2 className="font-bold text-[color:var(--brand-clay)] mb-1">
          Danger zone
        </h2>
        <p className="text-sm text-[color:var(--muted)] mb-4">
          Remove all demo data stored in your browser — products, orders,
          payments, invoices, settings, and auth session. You will be signed
          out.
        </p>
        <button
          onClick={clearAllData}
          className="px-4 py-2 rounded-lg border border-[color:var(--brand-clay)] text-[color:var(--brand-clay)] text-sm font-semibold hover:bg-[color:var(--brand-clay)]/5 transition"
        >
          Clear all demo data
        </button>
      </div>
    </div>
  );
}
