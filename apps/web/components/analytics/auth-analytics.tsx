"use client";

import { analytics } from "@redshirt-sports/analytics";
import { useUser } from "@redshirt-sports/auth/client";
import { useEffect } from "react";

const SIGN_IN_TRACKED_KEY = "rs_sign_in_tracked";

/**
 * Ties the browser's PostHog session to the Clerk user so signed-in activity
 * (ballots, retention) joins up with the server-side events, which already use
 * the Clerk user ID as the distinct ID. Also fires `sign_in_completed` once
 * per browser session. Mount inside the auth provider.
 */
export function AuthAnalytics() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!(isLoaded && isSignedIn && user)) return;

    analytics?.identify(user.id);

    try {
      if (window.sessionStorage.getItem(SIGN_IN_TRACKED_KEY)) return;
      window.sessionStorage.setItem(SIGN_IN_TRACKED_KEY, "1");
    } catch {
      // Storage blocked: fall through and accept a possible duplicate event.
    }
    analytics?.capture("sign_in_completed");
  }, [isLoaded, isSignedIn, user]);

  return null;
}
