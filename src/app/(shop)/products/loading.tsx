export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10 lg:py-14">
      <header className="mb-8">
        <div className="h-3 w-32 bg-[color:var(--brand-cream)] rounded mb-3 animate-pulse" />
        <div className="h-10 w-64 bg-[color:var(--brand-cream)] rounded mb-2 animate-pulse" />
        <div className="h-4 w-80 max-w-full bg-[color:var(--brand-cream)] rounded animate-pulse" />
      </header>

      <div className="grid lg:grid-cols-[280px_1fr] gap-8">
        <aside className="space-y-4">
          <div className="card animate-pulse h-64" />
          <div className="card animate-pulse h-80" />
        </aside>

        <div>
          <div className="h-5 w-40 bg-[color:var(--brand-cream)] rounded mb-5 animate-pulse" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-[color:var(--border)] rounded-xl overflow-hidden">
                <div className="aspect-square bg-[color:var(--brand-cream)] animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-20 bg-[color:var(--brand-cream)] rounded animate-pulse" />
                  <div className="h-4 w-full bg-[color:var(--brand-cream)] rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-[color:var(--brand-cream)] rounded animate-pulse" />
                  <div className="flex items-center justify-between pt-2">
                    <div className="h-5 w-16 bg-[color:var(--brand-cream)] rounded animate-pulse" />
                    <div className="h-8 w-20 bg-[color:var(--brand-cream)] rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
