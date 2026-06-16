import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/products";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function AdminCustomerDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role === "customer") redirect("/login");

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  const [orders, notifications] = await Promise.all([
    prisma.order.findMany({
      where: { customerEmail: customer.email },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.findMany({
      where: { email: customer.email },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalSpend = orders.reduce((n, o) => n + o.total, 0);

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <nav className="text-xs text-[color:var(--muted)] flex items-center gap-1.5">
        <Link href="/admin/customers" className="hover:text-[color:var(--brand-navy)]">Customers</Link>
        <span>/</span>
        <span className="text-[color:var(--brand-navy)] font-medium">{customer.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-[color:var(--brand-navy)] flex items-center justify-center text-white text-2xl font-bold shadow">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[color:var(--brand-navy)]">{customer.name}</h1>
            <p className="text-sm text-[color:var(--muted)]">{customer.email}</p>
            {customer.phone && <p className="text-sm text-[color:var(--muted)]">{customer.phone}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {customer.newsletterSubscribed ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Newsletter subscriber
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--muted)] bg-gray-50 border border-[color:var(--border)] px-3 py-1 rounded-full">
              Not subscribed
            </span>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total orders", value: orders.length.toString() },
          { label: "Total spend", value: totalSpend > 0 ? formatPrice(totalSpend) : "—" },
          { label: "Notifications sent", value: notifications.length.toString() },
          {
            label: "Member since",
            value: new Date(customer.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" }),
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[color:var(--border)] p-4 shadow-sm">
            <div className="text-xs text-[color:var(--muted)] font-medium">{s.label}</div>
            <div className="text-xl font-bold text-[color:var(--brand-navy)] mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Profile */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[color:var(--border)] p-5 shadow-sm">
            <h2 className="font-bold text-[color:var(--brand-navy)] mb-4">Account details</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-[color:var(--muted)] mb-0.5">Full name</dt>
                <dd className="font-medium">{customer.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-[color:var(--muted)] mb-0.5">Email</dt>
                <dd className="font-medium break-all">{customer.email}</dd>
              </div>
              {customer.phone && (
                <div>
                  <dt className="text-xs text-[color:var(--muted)] mb-0.5">Phone</dt>
                  <dd className="font-medium">{customer.phone}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-[color:var(--muted)] mb-0.5">Registered</dt>
                <dd className="font-medium">
                  {new Date(customer.createdAt).toLocaleString("en-GH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[color:var(--muted)] mb-0.5">Newsletter</dt>
                <dd className={`font-semibold ${customer.newsletterSubscribed ? "text-green-600" : "text-[color:var(--muted)]"}`}>
                  {customer.newsletterSubscribed ? "Subscribed" : "Not subscribed"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="bg-white rounded-2xl border border-[color:var(--border)] p-5 shadow-sm">
              <h2 className="font-bold text-[color:var(--brand-navy)] mb-4">
                Notifications
                <span className="ml-2 text-xs font-normal text-[color:var(--muted)]">({notifications.length})</span>
              </h2>
              <ul className="space-y-3">
                {notifications.map((n) => (
                  <li key={n.id} className={`rounded-lg border p-3 ${n.read ? "border-[color:var(--border)]" : "border-blue-200 bg-blue-50"}`}>
                    <div className="text-xs font-semibold text-[color:var(--brand-navy)]">{n.title}</div>
                    <div className="text-[11px] text-[color:var(--muted)] mt-0.5">{n.body}</div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className={`text-[9px] font-semibold uppercase tracking-wide ${n.read ? "text-green-600" : "text-blue-600"}`}>
                        {n.read ? "Read" : "Unread"}
                      </span>
                      <span className="text-[10px] text-[color:var(--muted)]">
                        {new Date(n.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Orders */}
        <div className="lg:col-span-2">
          <h2 className="font-bold text-[color:var(--brand-navy)] mb-4">
            Order history
            <span className="ml-2 text-xs font-normal text-[color:var(--muted)]">({orders.length} order{orders.length !== 1 ? "s" : ""})</span>
          </h2>

          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[color:var(--border)] p-10 text-center">
              <div className="text-4xl mb-3">📦</div>
              <div className="font-semibold text-[color:var(--brand-navy)]">No orders yet</div>
              <div className="text-sm text-[color:var(--muted)] mt-1">This customer hasn&apos;t placed any orders</div>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const items = JSON.parse(order.items) as Array<{ id: string; title: string; thumbnail: string; quantity: number; price: number }>;
                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="block bg-white rounded-xl border border-[color:var(--border)] p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-[color:var(--brand-navy)]">{order.number}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusColors[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-xs text-[color:var(--muted)] mt-1">
                          {new Date(order.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })}
                          {" · "}{items.length} item{items.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[color:var(--brand-navy)]">{formatPrice(order.total)}</div>
                        <div className="text-xs text-[color:var(--muted)]">View →</div>
                      </div>
                    </div>
                    {items.length > 0 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto">
                        {items.slice(0, 6).map((item) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={item.id}
                            src={item.thumbnail}
                            alt={item.title}
                            className="h-10 w-10 shrink-0 rounded-lg object-contain bg-[color:var(--brand-cream)] border border-[color:var(--border)] p-0.5"
                          />
                        ))}
                        {items.length > 6 && (
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-[color:var(--brand-cream)] border border-[color:var(--border)] flex items-center justify-center text-[10px] font-semibold text-[color:var(--muted)]">
                            +{items.length - 6}
                          </div>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
