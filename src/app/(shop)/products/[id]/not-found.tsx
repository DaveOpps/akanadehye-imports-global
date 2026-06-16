import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="max-w-2xl mx-auto px-5 lg:px-8 py-20 text-center">
      <div className="text-6xl mb-4">😕</div>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Product not found</h1>
      <p className="mt-3 text-[color:var(--muted)]">
        We couldn&apos;t find the product you&apos;re looking for. It may have been removed, or the link is broken.
      </p>
      <div className="mt-8 flex gap-3 justify-center flex-wrap">
        <Link href="/products" className="btn-gold">
          Browse all products
        </Link>
        <Link href="/" className="btn-outline">
          Back home
        </Link>
      </div>
    </div>
  );
}
