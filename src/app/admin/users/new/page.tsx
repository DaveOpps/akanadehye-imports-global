"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ALL_PERMISSIONS, PERMISSION_LABELS, type Permission } from "@/lib/permissions";

export default function NewUserPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"admin" | "super_admin">("admin");
  const [selectedPerms, setSelectedPerms] = useState<Set<Permission>>(new Set(ALL_PERMISSIONS));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function togglePerm(perm: Permission) {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm); else next.add(perm);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSaving(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, email, password, role,
        permissions: role === "admin" ? JSON.stringify([...selectedPerms]) : null,
      }),
    });
    setSaving(false);
    if (res.ok) router.push("/admin/users");
    else { const d = await res.json(); setError(d.error ?? "Failed to create user."); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <nav className="text-xs text-[color:var(--muted)] flex items-center gap-1.5">
        <Link href="/admin/users" className="hover:text-[color:var(--brand-navy)]">Team &amp; Privileges</Link>
        <span>/</span>
        <span className="text-[color:var(--brand-navy)] font-medium">New user</span>
      </nav>

      <h1 className="text-2xl font-bold text-[color:var(--brand-navy)]">Add admin user</h1>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-[color:var(--border)] p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-[color:var(--brand-navy)]">Profile</h2>
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Full name <span className="text-red-500">*</span></span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Sarah Mensah" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Email <span className="text-red-500">*</span></span>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="sarah@akanadehye.com" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Password <span className="text-red-500">*</span></span>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-11"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted)] hover:text-[color:var(--brand-navy)] transition"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
              </button>
            </div>
          </label>
        </div>

        {/* Role */}
        <div className="bg-white rounded-2xl border border-[color:var(--border)] p-6 shadow-sm space-y-3">
          <h2 className="font-bold text-[color:var(--brand-navy)]">Role</h2>
          {(["admin", "super_admin"] as const).map((r) => (
            <label key={r} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${role === r ? "border-[color:var(--brand-navy)] bg-[color:var(--brand-cream)]/60" : "border-[color:var(--border)] hover:bg-[color:var(--brand-cream)]/30"}`}>
              <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="mt-0.5 accent-[color:var(--brand-navy)]" />
              <div>
                <div className="text-sm font-semibold text-[color:var(--brand-navy)]">
                  {r === "super_admin" ? "⭐ Super Admin" : "Admin"}
                </div>
                <div className="text-xs text-[color:var(--muted)] mt-0.5">
                  {r === "super_admin"
                    ? "Unrestricted access to everything, including user management."
                    : "Restricted to the sections you choose below."}
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Permissions */}
        {role === "admin" && (
          <div className="bg-white rounded-2xl border border-[color:var(--border)] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[color:var(--brand-navy)]">Section access</h2>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setSelectedPerms(new Set(ALL_PERMISSIONS))} className="text-xs font-semibold text-[color:var(--brand-navy)] hover:underline">Select all</button>
                <span className="text-[color:var(--border)]">·</span>
                <button type="button" onClick={() => setSelectedPerms(new Set())} className="text-xs font-semibold text-[color:var(--muted)] hover:text-[color:var(--brand-navy)]">Clear all</button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {ALL_PERMISSIONS.map((perm) => (
                <label key={perm} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${selectedPerms.has(perm) ? "border-[color:var(--brand-navy)] bg-[color:var(--brand-cream)]/60" : "border-[color:var(--border)] hover:bg-[color:var(--brand-cream)]/30"}`}>
                  <input type="checkbox" checked={selectedPerms.has(perm)} onChange={() => togglePerm(perm)} className="h-4 w-4 accent-[color:var(--brand-navy)] shrink-0" />
                  <span className="text-sm font-medium text-[color:var(--brand-navy)]">{PERMISSION_LABELS[perm]}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? "Creating…" : "Create user"}
          </button>
          <Link href="/admin/users" className="text-sm text-[color:var(--muted)] hover:text-[color:var(--brand-navy)]">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
