import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AssistantChat from "@/components/AssistantChat";
import CartToast from "@/components/CartToast";

/**
 * Shop layout — wraps every shopper-facing page with the marketplace chrome:
 * top Navbar (logo + search + cart), Footer, floating WhatsApp button and the
 * assistant chat (stacked above it, not over it).
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
      <AssistantChat />
      <CartToast />
    </>
  );
}
