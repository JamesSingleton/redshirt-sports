import { Suspense } from "react";

import { RankingsDivisionChrome } from "@/components/rankings/rankings-division-chrome";
import { RankingsWeekChromeSkeleton } from "@/components/rankings/rankings-week-chrome-skeleton";

export default function RankingsDivisionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ sport: string; division: string }>;
}) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-site px-4 lg:px-6">
      <Suspense fallback={<RankingsWeekChromeSkeleton />}>
        <RankingsDivisionChrome params={params} />
      </Suspense>
      {children}
    </div>
  );
}
