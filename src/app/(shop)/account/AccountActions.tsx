"use client";

import { signOut } from "next-auth/react";

export default function AccountActions() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[color:var(--border)] text-sm font-medium text-[color:var(--muted)] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Sign out
    </button>
  );
}
