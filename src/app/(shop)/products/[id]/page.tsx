import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, getRelatedProducts } from "@/lib/shop-products";
import { formatPrice, discountedPrice } from "@/lib/products";
import ProductGallery from "@/components/ProductGallery";
import ProductCartPanel from "@/components/ProductCartPanel";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id).catch(() => null);
  if (!product) return { title: "Product not found — Akanadehye" };
  return {
    title: `${product.title} — Akanadehye`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 200),
      images: product.images?.[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const product = await getProduct(id).catch(() => null);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category, product.id, 6);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-[color:var(--muted)] mb-5 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[color:var(--brand-navy)]">Home</Link>
        <span className="text-[color:var(--border)]">/</span>
        <Link href="/products" className="hover:text-[color:var(--brand-navy)]">Shop</Link>
        <span className="text-[color:var(--border)]">/</span>
        <Link href={`/products?category=${product.category}`} className="hover:text-[color:var(--brand-navy)] capitalize">
          {product.category.replace(/-/g, " ")}
        </Link>
        <span className="text-[color:var(--border)]">/</span>
        <span className="text-[color:var(--brand-navy)] font-medium truncate max-w-xs">{product.title}</span>
      </nav>

      {/* 3-column: gallery / info / cart panel */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Gallery */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl border border-[color:var(--border)] p-4">
            <ProductGallery images={product.images} alt={product.title} />
          </div>
        </div>

        {/* Info */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-xl border border-[color:var(--border)] p-5">
            <div className="flex items-center gap-2 mb-3 text-xs">
              <Link
                href={`/products?category=${product.category}`}
                className="chip capitalize hover:bg-[color:var(--brand-gold)]/30"
              >
                {product.category.replace(/-/g, " ")}
              </Link>
              {product.brand && (
                <span className="text-[color:var(--muted)]">by <strong>{product.brand}</strong></span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight leading-tight">
              {product.title}
            </h1>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-[color:var(--brand-gold)]">★</span>
              <span className="font-medium">{product.rating.toFixed(1)}</span>
              {product.reviews && product.reviews.length > 0 && (
                <span className="text-[color:var(--muted)]">({product.reviews.length} reviews)</span>
              )}
              {product.sku && (
                <>
                  <span className="text-[color:var(--border)]">·</span>
                  <span className="text-xs text-[color:var(--muted)] font-mono">SKU: {product.sku}</span>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl border border-[color:var(--border)] p-5">
            <h2 className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold mb-2">
              About this product
            </h2>
            <p className="text-[color:var(--brand-navy)] leading-relaxed text-sm">{product.description}</p>

            {/* Specs */}
            <div className="grid sm:grid-cols-2 gap-2 mt-4">
              {product.shippingInformation && (
                <InfoChip icon="truck" label="Shipping" value={product.shippingInformation} />
              )}
              {product.warrantyInformation && (
                <InfoChip icon="shield" label="Warranty" value={product.warrantyInformation} />
              )}
              {product.returnPolicy && (
                <InfoChip icon="return" label="Returns" value={product.returnPolicy} />
              )}
              {product.minimumOrderQuantity && product.minimumOrderQuantity > 1 && (
                <InfoChip icon="box" label="Min. order" value={`${product.minimumOrderQuantity} units`} />
              )}
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-[color:var(--border)]">
                {product.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/products?q=${encodeURIComponent(t)}`}
                    className="text-xs px-2.5 py-1 rounded-full bg-[color:var(--brand-cream)] hover:bg-[color:var(--brand-gold)]/30 transition"
                  >
                    #{t}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="bg-white rounded-xl border border-[color:var(--border)] p-5">
              <h2 className="text-xs uppercase tracking-wider text-[color:var(--muted)] font-semibold mb-3">
                Reviews ({product.reviews.length})
              </h2>
              <ul className="space-y-4 divide-y divide-[color:var(--border)]">
                {product.reviews.map((r, i) => (
                  <li key={i} className="pt-4 first:pt-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="font-semibold text-sm">{r.reviewerName}</div>
                      <div className="text-xs text-[color:var(--muted)]">
                        {new Date(r.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-[color:var(--brand-gold)] text-xs mb-1.5" aria-label={`${r.rating} out of 5`}>
                      {"★".repeat(Math.round(r.rating))}{"☆".repeat(5 - Math.round(r.rating))}
                    </div>
                    <p className="text-sm text-[color:var(--brand-navy)]/90 leading-relaxed">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sticky cart panel */}
        <aside className="lg:col-span-3 lg:sticky lg:top-20 lg:self-start">
          <ProductCartPanel product={product} />
        </aside>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-12">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight">You may also like</h2>
            <Link
              href={`/products?category=${product.category}`}
              className="text-sm font-semibold text-[color:var(--brand-navy)] hover:text-[color:var(--brand-clay)]"
            >
              See all →
            </Link>
          </div>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {related.map((p) => {
              const rp = discountedPrice(p);
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group bg-white border border-[color:var(--border)] rounded-xl overflow-hidden hover:shadow-lg transition"
                >
                  <div className="relative aspect-square bg-[color:var(--brand-cream)]">
                    <Image
                      src={p.thumbnail}
                      alt={p.title}
                      fill
                      sizes="(min-width: 1024px) 16vw, 33vw"
                      className="object-contain p-3 group-hover:scale-105 transition"
                      unoptimized
                    />
                    {p.discountPercentage > 0 && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[color:var(--brand-clay)] text-white text-[10px] font-bold">
                        -{Math.round(p.discountPercentage)}%
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-xs leading-snug line-clamp-2 min-h-[2rem]">{p.title}</h3>
                    <div className="mt-1.5 flex items-end justify-between">
                      <div className="font-bold text-sm text-[color:var(--brand-navy)]">{formatPrice(rp)}</div>
                      <div className="text-[10px] text-[color:var(--muted)]">
                        <span className="text-[color:var(--brand-gold)]">★</span> {p.rating.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function InfoChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  const paths: Record<string, React.ReactNode> = {
    truck: <path d="M3 7h11v10H3zM14 11h5l2 3v3h-7M7 20a2 2 0 100-4 2 2 0 000 4zM17 20a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    return: <path d="M3 12a9 9 0 109-9v3M3 12l3-3m-3 3l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    box: <path d="M3 8l9-5 9 5v8l-9 5-9-5V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  };
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-[color:var(--brand-cream)]/40 border border-[color:var(--border)]">
      <span className="text-[color:var(--brand-navy)] shrink-0 mt-0.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">{paths[icon]}</svg>
      </span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-[color:var(--muted)] font-semibold">{label}</div>
        <div className="text-xs font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
