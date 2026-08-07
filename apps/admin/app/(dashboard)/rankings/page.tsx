import { Suspense } from "react";

import { getPublishRankingsBootstrap } from "@/actions/publish-rankings";
import { PublishRankingsDesk } from "@/components/publish-rankings-desk";

function RankingsFallback() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="bg-muted h-3 w-28 animate-pulse rounded" />
        <div className="bg-muted h-9 w-64 max-w-full animate-pulse rounded" />
      </div>
      <div className="bg-muted h-24 w-full animate-pulse rounded-xl" />
      <div className="bg-muted h-80 w-full animate-pulse rounded-xl" />
    </div>
  );
}

async function RankingsContent() {
  const { polls } = await getPublishRankingsBootstrap();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
          Top 25
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Publish rankings
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Load a week, nudge missing voters, then publish when you&apos;re ready
          — usually Sunday night after Saturday games.
        </p>
      </div>
      <PublishRankingsDesk polls={polls} />
    </div>
  );
}

export default function RankingsPage() {
  return (
    <Suspense fallback={<RankingsFallback />}>
      <RankingsContent />
    </Suspense>
  );
}
