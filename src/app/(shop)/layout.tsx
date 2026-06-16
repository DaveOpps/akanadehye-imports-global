import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import CartToast from "@/components/CartToast";

/**
 * Shop layout — wraps every shopper-facing page with the marketplace chrome:
 * top Navbar (logo + search + cart), Footer, floating WhatsApp button.
 *
 * Dashboard routes are NOT inside this group and never see these components.
 */
export default function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
      <CartToast />
    </>
  );
}
