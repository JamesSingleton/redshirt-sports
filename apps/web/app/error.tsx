"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@redshirt-sports/ui/components/empty";
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
    <div className="container py-12 md:py-20">
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle className="headline text-2xl">
            <h1>Something went wrong</h1>
          </EmptyTitle>
          <EmptyDescription>
            We hit an unexpected error loading this page. Try again, and if it
            keeps happening, check back shortly.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => reset()}>Try again</Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
