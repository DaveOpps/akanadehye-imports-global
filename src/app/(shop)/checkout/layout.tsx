import CheckoutSteps from "@/components/CheckoutSteps";
import Link from "next/link";

export const metadata = {
  title: "Checkout — Akanadehye",
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto px-5 lg:px-8 py-10 lg:py-14">
      <header className="mb-8">
        <nav className="text-xs text-[color:var(--muted)] mb-3 flex items-center gap-1.5">
          <Link href="/" className="hover:text-[color:var(--brand-navy)]">Home</Link>
          <span className="text-[color:var(--border)]">/</span>
          <Link href="/cart" className="hover:text-[color:var(--brand-navy)]">Cart</Link>
          <span className="text-[color:var(--border)]">/</span>
          <span className="text-[color:var(--brand-navy)] font-medium">Checkout</span>
        </nav>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Checkout</h1>
      </header>

      <CheckoutSteps />

      <div className="mt-8">{children}</div>
    </div>
  );
}
