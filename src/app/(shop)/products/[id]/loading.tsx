export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8 lg:py-12">
      <div className="h-3 w-64 max-w-full bg-[color:var(--brand-cream)] rounded mb-6 animate-pulse" />

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl bg-[color:var(--brand-cream)] animate-pulse" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-[color:var(--brand-cream)] animate-pulse" />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-5 w-32 bg-[color:var(--brand-cream)] rounded animate-pulse" />
            <div className="h-10 w-full bg-[color:var(--brand-cream)] rounded animate-pulse" />
            <div className="h-10 w-3/4 bg-[color:var(--brand-cream)] rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-12 w-40 bg-[color:var(--brand-cream)] rounded animate-pulse" />
            <div className="h-4 w-32 bg-[color:var(--brand-cream)] rounded animate-pulse" />
          </div>
          <div className="h-12 w-full bg-[color:var(--brand-cream)] rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-[color:var(--brand-cream)] rounded animate-pulse" />
            <div className="h-4 w-full bg-[color:var(--brand-cream)] rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-[color:var(--brand-cream)] rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
