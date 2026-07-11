"use client";

import { Button } from "@redshirt-sports/ui/components/button";

export default function SearchError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container px-4 py-16">
      <div className="mx-auto max-w-xl rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-black tracking-tight">
          Search is temporarily unavailable
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Try reloading the results. You can also browse the latest college
          sports news while search recovers.
        </p>
        <Button type="button" onClick={reset} className="mt-6">
          Try again
        </Button>
      </div>
    </div>
  );
}
