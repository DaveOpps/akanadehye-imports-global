import Link from "next/link";

export default function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
}: {
  title: string;
  subtitle?: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="text-xs text-[color:var(--muted)] mb-2 flex items-center gap-1.5 flex-wrap" aria-label="Breadcrumb">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {b.href ? (
                <Link href={b.href} className="hover:text-[color:var(--brand-navy)] transition">
                  {b.label}
                </Link>
              ) : (
                <span className="text-[color:var(--brand-navy)] font-medium">{b.label}</span>
              )}
              {i < breadcrumb.length - 1 && <span className="text-[color:var(--border)]">/</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-[color:var(--muted)] text-sm md:text-base">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
