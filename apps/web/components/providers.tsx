"use client";

import PlausibleProvider from "next-plausible";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useIsPresentationTool } from "next-sanity/hooks";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { type ReactNode, useEffect } from "react";

import { isPreviewSession } from "@/lib/is-preview-session";

function useAnalyticsEnabled(draftModeEnabled: boolean) {
  const isPresentationTool = useIsPresentationTool();
  return !draftModeEnabled && !isPresentationTool && !isPreviewSession();
}

export function Providers({
  children,
  draftModeEnabled = false,
}: {
  children: ReactNode;
  draftModeEnabled?: boolean;
}) {
  const analyticsEnabled = useAnalyticsEnabled(draftModeEnabled);

  useEffect(() => {
    if (!analyticsEnabled) {
      if (posthog.__loaded) {
        posthog.opt_out_capturing();
      }
      return;
    }

    if (!posthog.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        defaults: "2026-01-30",
      });
    } else {
      posthog.opt_in_capturing();
    }
  }, [analyticsEnabled]);

  const themed = (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      enableColorScheme
    >
      {children}
    </NextThemesProvider>
  );

  if (!analyticsEnabled) {
    return themed;
  }

  return (
    <PHProvider client={posthog}>
      <PlausibleProvider src="https://plausible.io/js/pa-UT66DP3cChsMGSbfVqOGV.js">
        {themed}
      </PlausibleProvider>
    </PHProvider>
  );
}
