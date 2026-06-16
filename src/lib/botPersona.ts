"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Bot persona — customisable strings that the bot brain weaves into replies.
 *
 * Read on the server too (see api/bots/test, telegram, whatsapp routes) via
 * a future Prisma swap. For now persists in localStorage and is sent to the
 * test endpoint as part of the message payload so the test chat behaves the
 * same as a real bot conversation would.
 */
export type BotPersona = {
  shopName: string;
  greeting: string;
  hours: string;
  contactPhone: string;
  contactEmail: string;
  /** "formal" | "friendly" | "casual" — flavours the response copy */
  tone: "formal" | "friendly" | "casual";
};

export const DEFAULT_PERSONA: BotPersona = {
  shopName: "Akanadehye",
  greeting: "👋 Welcome to Akanadehye! I can help you find products.",
  hours: "Mon–Sat 8am–8pm GMT",
  contactPhone: "+233 50 000 0000",
  contactEmail: "hello@akanadehye.com",
  tone: "friendly",
};

const STORAGE_KEY = "akanadehye-bot-persona-v1";

export function usePersona() {
  const [persona, setPersonaState] = useState<BotPersona>(DEFAULT_PERSONA);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPersonaState({ ...DEFAULT_PERSONA, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  const setPersona = useCallback((patch: Partial<BotPersona>) => {
    setPersonaState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setPersonaState(DEFAULT_PERSONA);
  }, []);

  return { persona, setPersona, reset, hydrated };
}
