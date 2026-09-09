"use client";

import { buttonVariants } from "@redshirt-sports/ui/components/button";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { useState, useTransition } from "react";

import { loadVoterBreakdown } from "@/actions/load-voter-breakdown";
import type { RankingsVoterBreakdownProps } from "@/components/rankings/rankings-voter-breakdown";
import VoterBallotBreakdown from "@/components/rankings/voter-ballot-breakdown";
import { VoterBreakdownSkeleton } from "@/components/rankings/voter-breakdown-skeleton";
import type { VoterBreakdown } from "@/types/votes";

export function LazyVoterBreakdown(props: RankingsVoterBreakdownProps) {
  const [voterBreakdown, setVoterBreakdown] = useState<
    VoterBreakdown[] | null | undefined
  >(undefined);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isLoaded = voterBreakdown !== undefined;

  function handleLoad() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await loadVoterBreakdown(props);
        setVoterBreakdown(result);
      } catch {
        setError("Unable to load voter ballots. Please try again.");
        setVoterBreakdown(null);
      }
    });
  }

  if (!isLoaded && !isPending) {
    return (
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={handleLoad}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          View voter ballots
        </button>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="mt-8">
        <VoterBreakdownSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 space-y-3 text-center">
        <p className="text-muted-foreground text-sm">{error}</p>
        <button
          type="button"
          onClick={handleLoad}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!voterBreakdown) {
    return null;
  }

  return (
    <div className="mt-8">
      <VoterBallotBreakdown voterBreakdown={voterBreakdown} />
    </div>
  );
}
