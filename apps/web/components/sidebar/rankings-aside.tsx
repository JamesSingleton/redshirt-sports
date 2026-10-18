import {
  Card,
  CardContent,
  CardHeader,
} from "@redshirt-sports/ui/components/card";
import { Skeleton } from "@redshirt-sports/ui/components/skeleton";
import { Suspense } from "react";

import type { SportParam } from "@/utils/espn";
import { LatestRankingsCard } from "./latest-rankings-card";

export function RankingsCardSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <Card className="gap-0 py-0 shadow-xs">
      <CardHeader className="gap-2 px-5 pt-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="px-5 pt-3 pb-5">
        <div className="divide-y">
          {Array.from({ length: rows }, (_, index) => (
            <div key={index} className="flex items-center gap-3 py-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Streams the latest poll into a sidebar without blocking the page shell. */
export function RankingsAside({
  sport = "football",
  division = "fcs",
  limit = 10,
}: {
  sport?: SportParam;
  division?: string;
  limit?: number;
}) {
  return (
    <Suspense fallback={<RankingsCardSkeleton rows={limit} />}>
      <LatestRankingsCard sport={sport} division={division} limit={limit} />
    </Suspense>
  );
}
