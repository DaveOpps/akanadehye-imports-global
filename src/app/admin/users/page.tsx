import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parsePermissions, ALL_PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "super_admin") redirect("/admin");

  const callerId = (session.user as { id?: string }).id!;
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, permissions: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--brand-navy)]">Team &amp; Privileges</h1>
          <p className="text-sm text-[color:var(--muted)] mt-1">Manage who can access the dashboard and what they can do</p>
        </div>
        <Link
          href="/admin/users/new"
          className="btn-primary text-sm"
        >
          + Add admin user
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Total admin users", value: users.length },
          { label: "Super admins", value: users.filter((u) => u.role === "super_admin").length },
          { label: "Restricted admins", value: users.filter((u) => u.role === "admin").length },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[color:var(--border)] p-4 shadow-sm">
            <div className="text-xs text-[color:var(--muted)] font-medium">{s.label}</div>
            <div className="text-2xl font-bold text-[color:var(--brand-navy)] mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[color:var(--border)] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border)] bg-[color:var(--brand-cream)]/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wider hidden md:table-cell">Permissions</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[color:var(--muted)] uppercase tracking-wider hidden lg:table-cell">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {users.map((u) => {
              const perms = parsePermissions(u.permissions);
              const isSelf = u.id === callerId;
              return (
                <tr key={u.id} className="hover:bg-[color:var(--brand-cream)]/30 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-[color:var(--brand-navy)] flex items-center justify-center text-white text-xs font-bold">
                        {(u.name ?? u.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-[color:var(--brand-navy)]">
                          {u.name ?? "—"}
                          {isSelf && <span className="ml-2 text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">You</span>}
                        </div>
                        <div className="text-xs text-[color:var(--muted)]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "super_admin" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/></svg>
                        Super admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--brand-navy)] bg-[color:var(--brand-cream)] border border-[color:var(--border)] px-2 py-0.5 rounded-full">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.role === "super_admin" ? (
                      <span className="text-xs text-green-700 font-semibold">Full access</span>
                    ) : perms === null || perms.length === ALL_PERMISSIONS.length ? (
                      <span className="text-xs text-green-700 font-semibold">Full access</span>
                    ) : perms.length === 0 ? (
                      <span className="text-xs text-red-600">No access</span>
                    ) : (
                      <span className="text-xs text-[color:var(--muted)]">{perms.length} of {ALL_PERMISSIONS.length} sections</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-[color:var(--muted)]">
                    {new Date(u.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="text-xs font-semibold text-[color:var(--brand-navy)] hover:underline"
                    >
                      {isSelf ? "Edit profile" : "Edit →"}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
