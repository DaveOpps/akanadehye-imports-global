const ITEMS = [
  { icon: "truck", title: "Free shipping", body: "On orders over $50" },
  { icon: "return", title: "Easy returns", body: "30 days, no questions" },
  { icon: "shield", title: "Secure payments", body: "Bank-grade encryption" },
  { icon: "chat", title: "24/7 support", body: "We're always here to help" },
];

export default function PromoStrip() {
  return (
    <section className="bg-[color:var(--brand-cream)]/60 border-y border-[color:var(--border)]">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-4 grid gap-3 grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[color:var(--brand-navy)] shrink-0">
              <Icon name={item.icon} />
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-sm text-[color:var(--brand-navy)] leading-tight">
                {item.title}
              </div>
              <div className="text-xs text-[color:var(--muted)] leading-tight truncate">
                {item.body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    truck: <path d="M3 7h11v10H3zM14 11h5l2 3v3h-7M7 20a2 2 0 100-4 2 2 0 000 4zM17 20a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    return: <path d="M3 12a9 9 0 109-9v3M3 12l3-3m-3 3l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
    chat: <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none">{paths[name]}</svg>;
}
