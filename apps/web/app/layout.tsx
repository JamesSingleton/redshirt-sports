import "@redshirt-sports/ui/globals.css";
import { SanityLive } from "@redshirt-sports/sanity/live";
import { Toaster } from "@redshirt-sports/ui/components/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Viewport } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import { Suspense } from "react";
import { preconnect, prefetchDNS } from "react-dom";

import { FooterServer, FooterSkeleton } from "@/components/footer";
import { CombinedJsonLd } from "@/components/json-ld";
import { NavbarServer, NavbarSkeleton } from "@/components/navbar";
import { Providers } from "@/components/providers";

const fontSans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const viewport: Viewport = {
  themeColor: "#E80022",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  preconnect("https://cdn.sanity.io");
  prefetchDNS("https://cdn.sanity.io");

  return (
    <html lang="en" suppressHydrationWarning className="bg-background">
      <body
        className={`${fontSans.variable} ${fontMono.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <Providers>
          <Suspense fallback={<NavbarSkeleton />}>
            <NavbarServer />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Suspense fallback={<FooterSkeleton />}>
            <FooterServer />
          </Suspense>
        </Providers>
        <SpeedInsights />
        <Toaster />
        <SanityLive />
        <CombinedJsonLd />
      </body>
    </html>
  );
}
