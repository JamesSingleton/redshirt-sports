import "./styles/redshirt.css";

import { AnalyticsProvider } from "@redshirt-sports/analytics/provider";
import {
  PUBLISHED_FETCH_OPTIONS,
  SanityLive,
} from "@redshirt-sports/sanity/live";
import { Toaster } from "@redshirt-sports/ui/components/sonner";
import type { Metadata, Viewport } from "next";
import { draftMode } from "next/headers";
import { connection } from "next/server";
import { VisualEditing } from "next-sanity/visual-editing";
import { Suspense } from "react";
import { preconnect, prefetchDNS } from "react-dom";

import { fontBarlow, fontInter, fontSourceSerif } from "@/app/fonts";
import { DisableDraftMode } from "@/components/disable-draft-mode";
import { CachedFooterServer, FooterSkeleton } from "@/components/footer";
import { CachedCombinedJsonLd } from "@/components/json-ld";
import { CachedNavbarServer, NavbarSkeleton } from "@/components/navbar";
import { Providers } from "@/components/providers";
import {
  DraftAwareFooter,
  DraftAwareJsonLd,
  DraftAwareNavbar,
} from "@/components/root-layout-chrome";
import { getRootMetadata } from "@/lib/seo";

export const viewport: Viewport = {
  themeColor: "#E80022",
};

export const metadata: Metadata = getRootMetadata();

async function MetadataConnectionMarker() {
  await connection();
  return null;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  preconnect("https://cdn.sanity.io");
  prefetchDNS("https://cdn.sanity.io");
  const { isEnabled: isDraftMode } = await draftMode();

  return (
    <html lang="en" suppressHydrationWarning>
      <AnalyticsProvider>
        <body
          className={`${fontBarlow.variable} ${fontInter.variable} ${fontSourceSerif.variable} flex min-h-screen flex-col font-sans antialiased`}
        >
          <Providers>
            {isDraftMode ? (
              <Suspense fallback={<NavbarSkeleton />}>
                <DraftAwareNavbar />
              </Suspense>
            ) : (
              <CachedNavbarServer {...PUBLISHED_FETCH_OPTIONS} />
            )}
            <main id="main" className="min-w-0 flex-1 overflow-x-clip">
              {children}
            </main>
            <Suspense fallback={null}>
              <MetadataConnectionMarker />
            </Suspense>
            {isDraftMode ? (
              <Suspense fallback={<FooterSkeleton />}>
                <DraftAwareFooter />
              </Suspense>
            ) : (
              <CachedFooterServer {...PUBLISHED_FETCH_OPTIONS} />
            )}
          </Providers>
          <Toaster />
          <SanityLive includeDrafts={isDraftMode} />
          {isDraftMode ? (
            <>
              <VisualEditing />
              <DisableDraftMode />
            </>
          ) : null}
          {isDraftMode ? (
            <Suspense>
              <DraftAwareJsonLd />
            </Suspense>
          ) : (
            <CachedCombinedJsonLd {...PUBLISHED_FETCH_OPTIONS} />
          )}
        </body>
      </AnalyticsProvider>
    </html>
  );
}
