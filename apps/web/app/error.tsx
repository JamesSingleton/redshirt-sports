"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";

/** How long to wait before the one automatic retry. */
const AUTO_RETRY_DELAY_MS = 1500;
/** No second automatic retry within this window, so a hard failure can't loop. */
const AUTO_RETRY_WINDOW_MS = 10_000;

let lastAutoRetryAt = 0;

/**
 * Most errors here are brief server failures during a background refresh (a
 * Sanity Live update re-renders every open tab at once). Retry once on our
 * own before showing the error, so a reader's page recovers by itself.
 * `retry()` re-fetches from the server; `reset()` would only re-render the
 * same failed result.
 */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const [autoRetrying, setAutoRetrying] = useState(
    () => Date.now() - lastAutoRetryAt > AUTO_RETRY_WINDOW_MS,
  );

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  useEffect(() => {
    if (!autoRetrying) return;
    lastAutoRetryAt = Date.now();
    const timer = setTimeout(() => {
      setAutoRetrying(false);
      retry();
    }, AUTO_RETRY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [autoRetrying, retry]);

  if (autoRetrying) {
    return (
      <div
        className="container flex min-h-[50vh] items-center justify-center py-16"
        role="status"
      >
        <p className="text-muted-foreground text-sm">Reloading…</p>
      </div>
    );
  }

  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <h2 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h2>
      <p className="text-muted-foreground max-w-md text-sm">
        We hit an unexpected error loading this page. You can try again — if
        this keeps happening, please check back shortly.
      </p>
      <Button onClick={() => retry()}>Try again</Button>
    </div>
  );
}
