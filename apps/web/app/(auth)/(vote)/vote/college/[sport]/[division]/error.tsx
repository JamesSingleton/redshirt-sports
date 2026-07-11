"use client";

import { Button } from "@redshirt-sports/ui/components/button";

export default function VoteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container px-4 py-16">
      <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-black tracking-tight">
          Ballot form could not be loaded
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Please try again. If the issue continues, your ballot has not been
          submitted yet.
        </p>
        <Button type="button" onClick={reset} className="mt-6">
          Try again
        </Button>
      </div>
    </div>
  );
}
