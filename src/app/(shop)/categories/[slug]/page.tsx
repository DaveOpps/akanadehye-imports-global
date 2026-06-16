import Link from "next/link";
import { notFound } from "next/navigation";
import { UMBRELLA_CATEGORIES, findUmbrellaForSlug } from "@/lib/storefront-categories";
import CategoryLandingPage from "@/components/CategoryLandingPage";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const umbrella = findUmbrellaForSlug(slug);
  if (!umbrella || umbrella.primarySlug !== slug) return { title: "Category — Akanadehye" };
  return {
    title: `${umbrella.label} — Akanadehye`,
    description: umbrella.blurb ?? `Shop ${umbrella.label} products at Akanadehye Imports Global.`,
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const umbrella = findUmbrellaForSlug(slug);

  // Only render for umbrella primary slugs — sub-slugs 404
  if (!umbrella || umbrella.primarySlug !== slug) notFound();

  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10 lg:py-14">
      {/* Breadcrumb */}
      <nav
        className="text-xs text-[color:var(--muted)] mb-6 flex items-center gap-1.5 flex-wrap"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-[color:var(--brand-navy)]">Home</Link>
        <span className="text-[color:var(--border)]">/</span>
        <Link href="/products" className="hover:text-[color:var(--brand-navy)]">Shop</Link>
        <span className="text-[color:var(--border)]">/</span>
        <span className="text-[color:var(--brand-navy)] font-medium">{umbrella.label}</span>
      </nav>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        {/* SIDEBAR */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="border border-[color:var(--border)] rounded-xl bg-white overflow-hidden">
            <div className="px-4 py-3 bg-[color:var(--brand-cream)] border-b border-[color:var(--border)]">
              <h2 className="font-semibold text-xs uppercase tracking-wider text-[color:var(--muted)]">
                Categories
              </h2>
            </div>
            <nav className="p-2 max-h-[80vh] overflow-y-auto">
              <Link
                href="/products"
                className="block px-3 py-1.5 rounded-md text-sm text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)]"
              >
                All products
              </Link>

              {UMBRELLA_CATEGORIES.map((u) => {
                const isActive = u.label === umbrella.label;
                return (
                  <div key={u.label} className="mt-2">
                    <Link
                      href={`/categories/${u.primarySlug}`}
                      className={`block px-3 py-1.5 rounded-md text-sm font-semibold transition ${
                        isActive
                          ? "bg-[color:var(--brand-navy)] text-white"
                          : "text-[color:var(--brand-navy)] hover:bg-[color:var(--brand-cream)]"
                      }`}
                    >
                      {u.label}
                    </Link>

                    {/* Expand sub-groups only for the active umbrella */}
                    {isActive && (
                      <div className="mt-1 ml-3 pl-3 border-l-2 border-[color:var(--brand-cream)] space-y-2">
                        {u.groups.map((g) => (
                          <div key={g.title}>
                            <div className="px-3 py-1 text-[10px] uppercase tracking-[0.1em] text-[color:var(--muted)] font-bold">
                              {g.title}
                            </div>
                            <ul>
                              {g.items.map((item, idx) => (
                                <li key={`${g.title}-${item.slug}-${idx}`}>
                                  <Link
                                    href={`/products?category=${item.slug}`}
                                    className="block px-3 py-1 rounded-md text-xs transition text-[color:var(--brand-navy)]/85 hover:bg-[color:var(--brand-cream)] hover:text-[color:var(--brand-navy)]"
                                  >
                                    {item.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* MAIN — Category landing */}
        <div>
          <CategoryLandingPage umbrella={umbrella} />
        </div>
      </div>
    </div>
  );
}
