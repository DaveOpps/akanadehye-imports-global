import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[color:var(--brand-navy)] text-white mt-24">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--brand-gold)] text-[color:var(--brand-navy)] font-bold text-lg">
              A
            </span>
            <span className="font-bold text-lg tracking-tight">Akanadehye</span>
          </div>
          <p className="mt-4 text-sm text-white/70 leading-relaxed">
            One platform for everything you need. Discover, compare, and buy
            across electronics, fashion, beauty, and more.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--brand-gold)] mb-3">
            Products
          </h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link href="/products?category=smartphones" className="hover:text-[color:var(--brand-gold)]">Smartphones</Link></li>
            <li><Link href="/products?category=mens-shirts" className="hover:text-[color:var(--brand-gold)]">Men&apos;s Shirts</Link></li>
            <li><Link href="/products?category=fragrances" className="hover:text-[color:var(--brand-gold)]">Fragrances</Link></li>
            <li><Link href="/products?category=furniture" className="hover:text-[color:var(--brand-gold)]">Furniture</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--brand-gold)] mb-3">
            Company
          </h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><a href="#" className="hover:text-[color:var(--brand-gold)]">About</a></li>
            <li><a href="#" className="hover:text-[color:var(--brand-gold)]">Careers</a></li>
            <li><a href="#" className="hover:text-[color:var(--brand-gold)]">Press</a></li>
            <li><a href="#" className="hover:text-[color:var(--brand-gold)]">Blog</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--brand-gold)] mb-3">
            Legal
          </h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><a href="#" className="hover:text-[color:var(--brand-gold)]">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-[color:var(--brand-gold)]">Terms of Use</a></li>
            <li><a href="#" className="hover:text-[color:var(--brand-gold)]">Cookie Policy</a></li>
            <li><a href="#" className="hover:text-[color:var(--brand-gold)]">Contact</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-5 flex flex-col md:flex-row justify-between gap-2 text-xs text-white/60">
          <p>© {new Date().getFullYear()} Akanadehye. All rights reserved.</p>
          <p>Built for shoppers across Africa and beyond.</p>
        </div>
      </div>
    </footer>
  );
}
