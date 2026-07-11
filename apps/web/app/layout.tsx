import "@redshirt-sports/ui/globals.css";

import { AnalyticsProvider } from "@redshirt-sports/analytics/provider";
import { SanityLive } from "@redshirt-sports/sanity/live";
import { Toaster } from "@redshirt-sports/ui/components/sonner";
import { cn } from "@redshirt-sports/ui/lib/utils";
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
import { Header } from "@/components/nav-test";
import { Providers } from "@/components/providers";
import { getRootMetadata } from "@/lib/seo";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const viewport: Viewport = {
  themeColor: "#E80022",
};

export const metadata = getRootMetadata();

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  preconnect("https://cdn.sanity.io");
  prefetchDNS("https://cdn.sanity.io");

  const isDraftMode = (await draftMode()).isEnabled;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", geist.variable)}
    >
      <AnalyticsProvider>
        <body
          className={`${geist.variable} ${fontMono.variable} flex min-h-screen flex-col font-sans antialiased`}
        >
          <Providers>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:font-medium focus:text-foreground focus:shadow"
            >
              Skip to main content
            </a>
            <Header />
            <main id="main-content" className="flex-1">
              {children}
            </main>
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
