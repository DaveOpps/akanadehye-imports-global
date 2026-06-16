import DashboardTopBar from "@/components/DashboardTopBar";
import DashboardShell from "@/components/DashboardShell";
import AuthGuard from "@/components/AuthGuard";

export const metadata = {
  title: "Admin Dashboard — Akanadehye",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardTopBar />
      <main className="flex-1">
        <DashboardShell>{children}</DashboardShell>
      </main>
    </AuthGuard>
  );
}
