import "@redshirt-sports/ui/globals.css";

import { SanityLive } from "@redshirt-sports/sanity/live";
import { Toaster } from "@redshirt-sports/ui/components/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Viewport } from "next";
import { draftMode } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { VisualEditing } from "next-sanity/visual-editing";
import { Suspense } from "react";
import { preconnect, prefetchDNS } from "react-dom";

import { DisableDraftMode } from "@/components/disable-draft-mode";
import { FooterServer, FooterSkeleton } from "@/components/footer";
import { CombinedJsonLd } from "@/components/json-ld";
import { NavbarServer, NavbarSkeleton } from "@/components/navbar";
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
      <body
        className={`${fontSans.variable} ${fontMono.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <Providers draftModeEnabled={isDraftMode}>
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
        {isDraftMode && (
          <>
            <VisualEditing />
            <DisableDraftMode />
          </>
        )}
        <CombinedJsonLd />
      </body>
    </html>
  );
}
