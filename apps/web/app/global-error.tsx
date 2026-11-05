"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    // global-error must include html and body tags
    <html lang="en-US">
      <body>
        <h2>Something went wrong!</h2>
        <Button onClick={() => retry()}>Try again</Button>
      </body>
    </html>
  );
}
