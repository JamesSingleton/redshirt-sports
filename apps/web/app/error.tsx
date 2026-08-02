"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <h2 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h2>
      <p className="text-muted-foreground max-w-md text-sm">
        We hit an unexpected error loading this page. You can try again — if
        this keeps happening, please check back shortly.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
