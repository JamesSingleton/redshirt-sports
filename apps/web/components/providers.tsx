"use client";

import PlausibleProvider from "next-plausible";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { type ReactNode, useEffect } from "react";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      defaults: "2026-01-30",
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <PlausibleProvider src="https://plausible.io/js/pa-UT66DP3cChsMGSbfVqOGV.js">
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          {children}
        </NextThemesProvider>
      </PlausibleProvider>
    </PHProvider>
  );
}
