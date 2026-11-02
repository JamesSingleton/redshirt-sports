import { Suspense } from "react";

import { getRatingsBootstrap } from "@/actions/ratings";
import { RatingsDesk } from "@/components/ratings-desk";

/** Server actions on this page sync from ESPN and compute whole seasons. */
export const maxDuration = 300;

function RatingsFallback() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="bg-muted h-9 w-64 max-w-full animate-pulse rounded" />
      <div className="bg-muted h-40 w-full animate-pulse rounded-xl" />
      <div className="bg-muted h-80 w-full animate-pulse rounded-xl" />
    </div>
  );
}

async function RatingsContent() {
  const pools = await getRatingsBootstrap();
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
          Computer ratings
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Ratings & SOS</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Pool-only ratings: strength of record, power, and strength of schedule
          counted only on games between pool members. The cron handles the
          weekend; use this page to run it early, backfill a season, review a
          draft, publish, or roll back.
        </p>
      </div>
      <RatingsDesk pools={pools} />
    </div>
  );
}

export default function RatingsPage() {
  return (
    <Suspense fallback={<RatingsFallback />}>
      <RatingsContent />
    </Suspense>
  );
}
