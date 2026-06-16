"use client";

import { useCallback, useEffect, useState } from "react";

export type AppSettings = {
  exchangeRate: number;        // GHS per USD
  defaultCurrency: "GHS" | "USD";
  lowStockDefault: number;     // default reorder level for new products
};

const SETTINGS_KEY = "akanadehye-settings-v1";

const DEFAULTS: AppSettings = {
  exchangeRate: 15.5,
  defaultCurrency: "GHS",
  lowStockDefault: 5,
};

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettingsState({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  const save = useCallback((patch: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return { settings, save, hydrated };
}
