import "@redshirt-sports/ui/globals.css";

import { AnalyticsProvider } from "@redshirt-sports/analytics/provider";
import { SanityLive } from "@redshirt-sports/sanity/live";
import { Toaster } from "@redshirt-sports/ui/components/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import { Suspense } from "react";
import { preconnect, prefetchDNS } from "react-dom";

import { DisableDraftMode } from "@/components/disable-draft-mode";
import {
  CachedFooterServer,
  DynamicFooterServer,
  FooterSkeleton,
} from "@/components/footer";
import {
  CachedCombinedJsonLd,
  DynamicCombinedJsonLd,
} from "@/components/json-ld";
import {
  CachedNavbarServer,
  DynamicNavbarServer,
  NavbarSkeleton,
} from "@/components/navbar";
import { Providers } from "@/components/providers";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
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

  const isDraftMode = (await draftMode()).isEnabled;

  return (
    <html lang="en" suppressHydrationWarning>
      <AnalyticsProvider>
        <body
          className={`${fontSans.variable} ${fontMono.variable} flex min-h-screen flex-col font-sans antialiased`}
        >
          <Providers>
            {isDraftMode ? (
              <Suspense fallback={<NavbarSkeleton />}>
                <DynamicNavbarServer />
              </Suspense>
            ) : (
              <CachedNavbarServer perspective="published" stega={false} />
            )}
            <main className="flex-1">{children}</main>
            {isDraftMode ? (
              <Suspense fallback={<FooterSkeleton />}>
                <DynamicFooterServer />
              </Suspense>
            ) : (
              <CachedFooterServer perspective="published" stega={false} />
            )}
          </Providers>
          <SpeedInsights />
          <Toaster />
          <SanityLive
            includeDrafts={isDraftMode}
            waitFor={
              process.env.VERCEL_ENV === "production" ? "function" : undefined
            }
          />
          {isDraftMode && (
            <>
              <VisualEditing />
              <DisableDraftMode />
            </>
          )}
          {isDraftMode ? (
            <Suspense>
              <DynamicCombinedJsonLd />
            </Suspense>
          ) : (
            <CachedCombinedJsonLd perspective="published" stega={false} />
          )}
        </body>
      </AnalyticsProvider>
    </html>
  );
}
