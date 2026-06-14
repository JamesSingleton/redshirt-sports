import posthog from "posthog-js";
import { keys } from "./keys";

export const initializeAnalytics = () => {
  const { NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST } = keys();

  if (!(NEXT_PUBLIC_POSTHOG_KEY && NEXT_PUBLIC_POSTHOG_HOST)) {
    return;
  }

  posthog.init(NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2026-01-30",
    capture_dead_clicks: true,
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
    // Opt out of capturing by default in development
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") {
        ph.opt_out_capturing();
      }
    },
  });
};
