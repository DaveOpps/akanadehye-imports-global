import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import AccountActions from "./AccountActions";
import NotificationsMarkRead from "./NotificationsMarkRead";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user) {
    redirect("/register");
  }
  if (role !== "customer") {
    redirect("/admin");
  }

  const customerEmail = session.user.email ?? "";
  const customer = await prisma.customer.findUnique({ where: { email: customerEmail } });

  if (!customer) redirect("/register");

  // Fetch orders and notifications in parallel
  const [orders, notifications] = await Promise.all([
    prisma.order.findMany({
      where: { customerEmail: customer.email },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.findMany({
      where: { email: customer.email },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto px-5 lg:px-8 py-10 lg:py-14">
      {/* Breadcrumb */}
      <nav className="text-xs text-[color:var(--muted)] mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-[color:var(--brand-navy)]">Home</Link>
        <span>/</span>
        <span className="text-[color:var(--brand-navy)] font-medium">My Account</span>
      </nav>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-[color:var(--brand-navy)]">
            Welcome back, {customer.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-[color:var(--muted)] mt-1">{customer.email}</p>
        </div>
        <AccountActions />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Profile card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-[color:var(--border)] p-5 shadow-sm">
            <h2 className="font-bold text-[color:var(--brand-navy)] mb-4">Profile</h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-[color:var(--muted)] text-xs mb-0.5">Full name</div>
                <div className="font-medium">{customer.name}</div>
              </div>
              <div>
                <div className="text-[color:var(--muted)] text-xs mb-0.5">Email</div>
                <div className="font-medium break-all">{customer.email}</div>
              </div>
              {customer.phone && (
                <div>
                  <div className="text-[color:var(--muted)] text-xs mb-0.5">Phone</div>
                  <div className="font-medium">{customer.phone}</div>
                </div>
              )}
              <div>
                <div className="text-[color:var(--muted)] text-xs mb-0.5">Member since</div>
                <div className="font-medium">
                  {new Date(customer.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })}
                </div>
              </div>
            </div>
          </div>

          {/* Newsletter status */}
          <div className={`rounded-2xl border p-4 text-sm ${customer.newsletterSubscribed ? "bg-green-50 border-green-200" : "bg-[color:var(--brand-cream)] border-[color:var(--border)]"}`}>
            <div className="flex items-start gap-2.5">
              {customer.newsletterSubscribed ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5 text-green-600">
                  <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5 text-[color:var(--muted)]">
                  <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" fill="currentColor"/>
                </svg>
              )}
              <div>
                <div className="font-semibold text-[color:var(--brand-navy)]">
                  {customer.newsletterSubscribed ? "Newsletter active" : "Newsletter off"}
                </div>
                <div className="text-xs text-[color:var(--muted)] mt-0.5">
                  {customer.newsletterSubscribed
                    ? "You'll receive deals and new arrivals at " + customer.email
                    : "You are not subscribed to newsletters"}
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/products"
            className="block w-full text-center px-4 py-2.5 rounded-xl bg-[color:var(--brand-navy)] text-white text-sm font-bold hover:bg-[color:var(--brand-navy-soft)] transition"
          >
            Continue shopping →
          </Link>
        </div>

        {/* Notifications + Orders */}
        <div className="lg:col-span-2 space-y-6">

          {/* Notifications */}
          {notifications.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-[color:var(--brand-navy)] flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-[color:var(--brand-clay)] text-white text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </h2>
                <NotificationsMarkRead />
              </div>
              <ul className="space-y-2">
                {notifications.map((n) => (
                  <li key={n.id} className={`rounded-xl border p-4 ${n.read ? "bg-white border-[color:var(--border)]" : "bg-blue-50 border-blue-200"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className={`text-sm font-semibold ${n.read ? "text-[color:var(--brand-navy)]" : "text-blue-800"}`}>{n.title}</div>
                        <div className="text-xs text-[color:var(--muted)] mt-0.5">{n.body}</div>
                      </div>
                      <div className="text-[10px] text-[color:var(--muted)] shrink-0 mt-0.5">
                        {new Date(n.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short" })}
                      </div>
                    </div>
                    {n.orderId && (
                      <Link href={`/orders/${n.orderId}`} className="mt-2 inline-block text-xs font-semibold text-[color:var(--brand-navy)] hover:underline">
                        View order {n.orderNumber} →
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Orders */}
          <div>
          <h2 className="font-bold text-[color:var(--brand-navy)] mb-4">
            Order history
            <span className="ml-2 text-xs font-normal text-[color:var(--muted)]">({orders.length} order{orders.length !== 1 ? "s" : ""})</span>
          </h2>

          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[color:var(--border)] p-10 text-center">
              <div className="text-4xl mb-3">📦</div>
              <h3 className="font-semibold text-[color:var(--brand-navy)]">No orders yet</h3>
              <p className="text-sm text-[color:var(--muted)] mt-1">Your orders will appear here once you place them.</p>
              <Link href="/products" className="mt-5 btn-gold inline-flex text-sm">
                Start shopping →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => {
                const items = JSON.parse(order.items) as Array<{ id: string; title: string; thumbnail: string; quantity: number }>;
                const statusColors: Record<string, string> = {
                  pending: "bg-amber-100 text-amber-700",
                  confirmed: "bg-blue-100 text-blue-700",
                  shipped: "bg-indigo-100 text-indigo-700",
                  delivered: "bg-green-100 text-green-700",
                  cancelled: "bg-red-100 text-red-700",
                };
                const statusLabels: Record<string, string> = {
                  pending: "Pending", confirmed: "Confirmed",
                  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
                };
                return (
                  <li key={order.id}>
                    <Link
                      href={`/orders/${order.id}`}
                      className="block bg-white rounded-xl border border-[color:var(--border)] p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-sm text-[color:var(--brand-navy)]">{order.number}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusColors[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                              {statusLabels[order.status] ?? order.status}
                            </span>
                          </div>
                          <div className="text-xs text-[color:var(--muted)] mt-1">
                            {new Date(order.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })} · {items.length} item{items.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[color:var(--brand-navy)]">{formatPrice(order.total)}</div>
                          <div className="text-xs text-[color:var(--muted)]">View →</div>
                        </div>
                      </div>
                      {items.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto">
                          {items.slice(0, 5).map((item) => (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              key={item.id}
                              src={item.thumbnail}
                              alt={item.title}
                              className="h-12 w-12 shrink-0 rounded-lg object-contain bg-[color:var(--brand-cream)] border border-[color:var(--border)] p-1"
                            />
                          ))}
                          {items.length > 5 && (
                            <div className="h-12 w-12 shrink-0 rounded-lg bg-[color:var(--brand-cream)] border border-[color:var(--border)] flex items-center justify-center text-xs font-semibold text-[color:var(--muted)]">
                              +{items.length - 5}
                            </div>
                          )}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          </div>{/* end orders */}
        </div>{/* end right col */}
      </div>
    </div>
  );
}
