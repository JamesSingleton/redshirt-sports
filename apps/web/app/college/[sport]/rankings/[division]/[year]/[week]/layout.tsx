import { Suspense } from "react";

import {
  RankingsWeekChrome,
  RankingsWeekChromeSkeleton,
} from "@/components/rankings/rankings-week-chrome";

export default function RankingsWeekLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{
    sport: string;
    division: string;
    year: string;
    week: string;
  }>;
}) {
  return (
    <>
      <Suspense fallback={<RankingsWeekChromeSkeleton />}>
        <RankingsWeekChrome params={params} />
      </Suspense>
      {children}
    </>
  );
}
