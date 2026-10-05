/**
 * Where to send a customer who needs help — used by the pre-order countdown
 * once an order passes its expected arrival date.
 *
 * The WhatsApp and phone numbers in the Help Centre are placeholders
 * (233000000000). Set the env vars below to the real business contacts and
 * every support link in the app picks them up; until then only the Help
 * Centre link is shown, rather than a number that doesn't connect.
 */

const PLACEHOLDER_NUMBER = "233000000000";

function clean(v: string | undefined): string | null {
  const s = (v ?? "").trim();
  if (!s) return null;
  // Guard against the placeholder leaking into a live link.
  if (s.replace(/\D/g, "").includes(PLACEHOLDER_NUMBER)) return null;
  return s;
}

export type SupportChannel = {
  kind: "whatsapp" | "email" | "help";
  label: string;
  href: string;
};

/** Help Centre is always available; the rest appear once configured. */
export function supportChannels(): SupportChannel[] {
  const out: SupportChannel[] = [];

  const whatsapp = clean(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP);
  if (whatsapp) {
    out.push({
      kind: "whatsapp",
      label: "Chat on WhatsApp",
      href: `https://wa.me/${whatsapp.replace(/\D/g, "")}`,
    });
  }

  const email = clean(process.env.NEXT_PUBLIC_SUPPORT_EMAIL);
  if (email) {
    out.push({ kind: "email", label: "Email support", href: `mailto:${email}` });
  }

  out.push({ kind: "help", label: "Visit the Help Centre", href: "/help" });
  return out;
}
