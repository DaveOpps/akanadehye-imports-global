import Link from "next/link";
import Image from "next/image";
import { discountedPrice, formatPrice, type Product } from "@/lib/products";

export default function ProductRail({
  title,
  products,
  seeAllHref,
  accent,
}: {
  title: string;
  products: Product[];
  seeAllHref: string;
  accent?: "navy" | "gold" | "clay" | "teal";
}) {
  if (products.length === 0) return null;

  const headerBg = {
    navy: "bg-[color:var(--brand-navy)]",
    gold: "bg-[color:var(--brand-gold)]",
    clay: "bg-[color:var(--brand-clay)]",
    teal: "bg-[color:var(--brand-teal)]",
  }[accent ?? "navy"];

  const headerText = accent === "gold" ? "text-[color:var(--brand-navy)]" : "text-white";

  return (
    <section className="bg-white border border-[color:var(--border)] rounded-xl overflow-hidden">
      <header
        className={`flex items-center justify-between px-5 py-3 ${headerBg} ${headerText}`}
      >
        <h2 className="font-bold text-lg tracking-tight">{title}</h2>
        <Link
          href={seeAllHref}
          className="text-sm font-semibold underline-offset-4 hover:underline"
        >
          See all →
        </Link>
      </header>

      <div className="flex overflow-x-auto scrollbar-hide divide-x divide-[color:var(--border)]">
        {products.map((p) => {
          const price = discountedPrice(p);
          return (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="shrink-0 w-44 md:w-52 p-3 hover:bg-[color:var(--brand-cream)]/40 transition group"
            >
              <div className="relative aspect-square bg-[color:var(--brand-cream)] rounded-lg overflow-hidden mb-2">
                <Image
                  src={p.thumbnail}
                  alt={p.title}
                  fill
                  sizes="208px"
                  className="object-contain p-3 group-hover:scale-105 transition"
                  unoptimized
                />
                {p.discountPercentage > 0 && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[color:var(--brand-clay)] text-white text-[10px] font-bold">
                    -{Math.round(p.discountPercentage)}%
                  </span>
                )}
              </div>
              <h3 className="font-medium text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                {p.title}
              </h3>
              <div className="mt-1.5 font-bold text-[color:var(--brand-navy)]">
                {formatPrice(price)}
              </div>
              {p.discountPercentage > 0 && (
                <div className="text-xs text-[color:var(--muted)] line-through">
                  {formatPrice(p.price)}
                </div>
              )}
              <div className="text-[10px] mt-1 text-[color:var(--muted)]">
                <span className="text-[color:var(--brand-gold)]">★</span> {p.rating.toFixed(1)} · {p.stock} left
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
