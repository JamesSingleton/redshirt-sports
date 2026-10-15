import "@redshirt-sports/ui/globals.css";

import { AnalyticsProvider } from "@redshirt-sports/analytics/provider";
import { Toaster } from "@redshirt-sports/ui/components/sonner";
import type { Metadata, Viewport } from "next";
import {
  Barlow_Condensed,
  Geist_Mono,
  Inter,
  Source_Serif_4,
} from "next/font/google";
import { Suspense } from "react";
import { preconnect, prefetchDNS } from "react-dom";

import { FooterSkeleton } from "@/components/footer";
import { NavbarSkeleton } from "@/components/navbar";
import { Providers } from "@/components/providers";
import {
  DraftAwareFooter,
  DraftAwareJsonLd,
  DraftAwareLiveAndEditing,
  DraftAwareNavbar,
} from "@/components/root-layout-chrome";
import { getRootMetadata } from "@/lib/seo";

const fontDisplay = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-barlow",
});

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fontSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const viewport: Viewport = {
  themeColor: "#E80022",
};

export const metadata: Metadata = getRootMetadata();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  preconnect("https://cdn.sanity.io");
  prefetchDNS("https://cdn.sanity.io");

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}
    >
      <AnalyticsProvider>
        <body className="flex min-h-screen flex-col font-sans antialiased">
          <Providers>
            <Suspense fallback={<NavbarSkeleton />}>
              <DraftAwareNavbar />
            </Suspense>
            <main className="flex-1">{children}</main>
            <Suspense fallback={<FooterSkeleton />}>
              <DraftAwareFooter />
            </Suspense>
          </Providers>
          <Toaster />
          <Suspense>
            <DraftAwareLiveAndEditing />
          </Suspense>
          <Suspense>
            <DraftAwareJsonLd />
          </Suspense>
        </body>
      </AnalyticsProvider>
    </html>
  );
}
