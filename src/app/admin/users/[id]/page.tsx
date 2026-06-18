"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ALL_PERMISSIONS, PERMISSION_LABELS, type Permission } from "@/lib/permissions";

type UserData = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  permissions: string | null;
};

type Params = Promise<{ id: string }>;

export default function EditUserPage({ params }: { params: Params }) {
  const { id } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "super_admin">("admin");
  const [selectedPerms, setSelectedPerms] = useState<Set<Permission>>(new Set());
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`/api/admin/users`)
      .then((r) => r.json())
      .then((d) => {
        const found = (d.users ?? []).find((u: UserData) => u.id === id);
        if (!found) { router.push("/admin/users"); return; }
        setUser(found);
        setName(found.name ?? "");
        setRole(found.role as "admin" | "super_admin");
        if (found.permissions) {
          try { setSelectedPerms(new Set(JSON.parse(found.permissions) as Permission[])); } catch { setSelectedPerms(new Set()); }
        } else {
          setSelectedPerms(new Set(ALL_PERMISSIONS));
        }
      });
  }, [id, router]);

  function togglePerm(perm: Permission) {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm); else next.add(perm);
      return next;
    });
  }

  function selectAll() { setSelectedPerms(new Set(ALL_PERMISSIONS)); }
  function clearAll() { setSelectedPerms(new Set()); }

  async function handleSave() {
    setError(""); setSuccess(""); setSaving(true);
    const body: Record<string, unknown> = { name, role };
    if (role === "admin") body.permissions = JSON.stringify([...selectedPerms]);
    if (newPassword) body.newPassword = newPassword;

    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) { setSuccess("Changes saved."); setNewPassword(""); }
    else { const d = await res.json(); setError(d.error ?? "Failed to save."); }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${user?.name ?? user?.email}? This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) router.push("/admin/users");
    else { const d = await res.json(); setError(d.error ?? "Failed to delete."); }
  }

  if (!user) {
    return <div className="py-20 text-center text-sm text-[color:var(--muted)]">Loading…</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <nav className="text-xs text-[color:var(--muted)] flex items-center gap-1.5">
        <Link href="/admin/users" className="hover:text-[color:var(--brand-navy)]">Team &amp; Privileges</Link>
        <span>/</span>
        <span className="text-[color:var(--brand-navy)] font-medium">{user.name ?? user.email}</span>
      </nav>

      <h1 className="text-2xl font-bold text-[color:var(--brand-navy)]">Edit user</h1>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5">{success}</div>}

      {/* Profile */}
      <div className="bg-white rounded-2xl border border-[color:var(--border)] p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-[color:var(--brand-navy)]">Profile</h2>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Full name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Name" />
        </label>
        <div>
          <span className="block text-sm font-medium mb-1.5">Email</span>
          <div className="input bg-[color:var(--brand-cream)] text-[color:var(--muted)] cursor-not-allowed">{user.email}</div>
        </div>
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">New password <span className="text-xs font-normal text-[color:var(--muted)]">(leave blank to keep current)</span></span>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input" placeholder="Min. 8 characters" />
        </label>
      </div>

      {/* Role */}
      <div className="bg-white rounded-2xl border border-[color:var(--border)] p-6 shadow-sm space-y-3">
        <h2 className="font-bold text-[color:var(--brand-navy)]">Role</h2>
        {(["super_admin", "admin"] as const).map((r) => (
          <label key={r} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${role === r ? "border-[color:var(--brand-navy)] bg-[color:var(--brand-cream)]/60" : "border-[color:var(--border)] hover:bg-[color:var(--brand-cream)]/30"}`}>
            <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="mt-0.5 accent-[color:var(--brand-navy)]" />
            <div>
              <div className="text-sm font-semibold text-[color:var(--brand-navy)] flex items-center gap-2">
                {r === "super_admin" ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" className="text-amber-500"/></svg>
                    Super Admin
                  </>
                ) : "Admin"}
              </div>
              <div className="text-xs text-[color:var(--muted)] mt-0.5">
                {r === "super_admin"
                  ? "Full access to everything including user management. Cannot be restricted."
                  : "Access only to the sections you enable below."}
              </div>
            </div>
          </label>
        ))}
      </div>

      {/* Permissions (only relevant for admin role) */}
      {role === "admin" && (
        <div className="bg-white rounded-2xl border border-[color:var(--border)] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[color:var(--brand-navy)]">Section access</h2>
            <div className="flex items-center gap-3">
              <button onClick={selectAll} className="text-xs font-semibold text-[color:var(--brand-navy)] hover:underline">Select all</button>
              <span className="text-[color:var(--border)]">·</span>
              <button onClick={clearAll} className="text-xs font-semibold text-[color:var(--muted)] hover:text-[color:var(--brand-navy)]">Clear all</button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {ALL_PERMISSIONS.map((perm) => (
              <label key={perm} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${selectedPerms.has(perm) ? "border-[color:var(--brand-navy)] bg-[color:var(--brand-cream)]/60" : "border-[color:var(--border)] hover:bg-[color:var(--brand-cream)]/30"}`}>
                <input
                  type="checkbox"
                  checked={selectedPerms.has(perm)}
                  onChange={() => togglePerm(perm)}
                  className="h-4 w-4 accent-[color:var(--brand-navy)] shrink-0"
                />
                <span className="text-sm font-medium text-[color:var(--brand-navy)]">{PERMISSION_LABELS[perm]}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-[color:var(--muted)]">
            {selectedPerms.size} of {ALL_PERMISSIONS.length} sections enabled
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete this user"}
        </button>
      </div>
    </div>
  );
}
