import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://akanadehye.com"),
  // This is the text WhatsApp, Facebook and search results show — for most
  // people it is the first thing they read about the business, so it has to
  // say "import/pre-order service", not "shop".
  title: {
    default: "Akanadehye Imports — Pre-Order Import Service",
    template: "%s · Akanadehye Imports",
  },
  description:
    "We import to order for Ghana and the diaspora. Reserve what you need and we source and ship it in — 5 business days by air, 45 by sea.",
  keywords: [
    "import service Ghana",
    "pre-order imports Ghana",
    "sourcing agent Ghana",
    "air freight Ghana",
    "sea freight Ghana",
    "Akanadehye",
    "Mobile Money",
  ],
  openGraph: {
    type: "website",
    siteName: "Akanadehye Imports",
    title: "Akanadehye Imports — Pre-Order Import Service",
    description:
      "An importing service, not a walk-in shop. Reserve it, we ship it in — 5 business days by air, 45 by sea.",
    locale: "en_GH",
  },
  twitter: {
    card: "summary_large_image",
    title: "Akanadehye Imports — Pre-Order Import Service",
    description:
      "An importing service, not a walk-in shop. Reserve it, we ship it in — 5 business days by air, 45 by sea.",
  },
};

/**
 * Root layout — minimal. Wraps the whole app in CartProvider (shared between
 * shop and dashboard contexts so cart state survives navigating between them).
 *
 * Shop chrome (Navbar, Footer, WhatsApp button) lives in (shop)/layout.tsx.
 * Dashboard chrome (TopBar + Sidebar) lives in dashboard/layout.tsx.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[color:var(--brand-navy)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
