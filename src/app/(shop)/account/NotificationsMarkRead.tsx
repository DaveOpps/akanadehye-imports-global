"use client";

import { useRouter } from "next/navigation";

export default function NotificationsMarkRead() {
  const router = useRouter();

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    router.refresh();
  }

  return (
    <button
      onClick={markAllRead}
      className="text-xs font-semibold text-[color:var(--muted)] hover:text-[color:var(--brand-navy)] transition"
    >
      Mark all read
    </button>
  );
}
