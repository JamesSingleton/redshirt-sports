import "@redshirt-sports/ui/globals.css";

import { AnalyticsProvider } from "@redshirt-sports/analytics/provider";
import { Toaster } from "@redshirt-sports/ui/components/sonner";
import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { preconnect, prefetchDNS } from "react-dom";

import { FooterSkeleton } from "@/components/footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NavbarSkeleton } from "@/components/navbar";
import { Providers } from "@/components/providers";
import {
  DraftAwareFooter,
  DraftAwareJsonLd,
  DraftAwareLiveAndEditing,
  DraftAwareNavbar,
} from "@/components/root-layout-chrome";
import { SiteTicker } from "@/components/site-ticker";
import { getRootMetadata } from "@/lib/seo";

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
    <html lang="en" suppressHydrationWarning>
      <AnalyticsProvider>
        <body className="flex min-h-screen flex-col font-sans antialiased">
          <Providers>
            <SiteTicker />
            <Suspense fallback={<NavbarSkeleton />}>
              <DraftAwareNavbar />
            </Suspense>
            <main className="flex-1">{children}</main>
            <Suspense fallback={<FooterSkeleton />}>
              <DraftAwareFooter />
            </Suspense>
            <MobileBottomNav />
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
