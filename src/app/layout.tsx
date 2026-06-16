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
  title: {
    default: "Akanadehye — One Platform. Everything You Need to Shop.",
    template: "%s · Akanadehye",
  },
  description:
    "Discover, compare, and buy across electronics, fashion, beauty, and more — all in one place. Built for shoppers across Ghana and the diaspora.",
  keywords: ["ecommerce Ghana", "online shopping Africa", "Akanadehye", "Mobile Money", "diaspora shopping"],
  openGraph: {
    type: "website",
    siteName: "Akanadehye",
    title: "Akanadehye — One Platform. Everything You Need to Shop.",
    description:
      "Discover, compare, and buy across electronics, fashion, beauty, and more — all in one place.",
    locale: "en_GH",
  },
  twitter: {
    card: "summary_large_image",
    title: "Akanadehye — One Platform. Everything You Need to Shop.",
    description: "Discover, compare, and buy across every category — all in one place.",
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
