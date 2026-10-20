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
    <main className="mx-auto max-w-site px-4 lg:px-6">
      <Suspense fallback={<RankingsWeekChromeSkeleton />}>
        <RankingsWeekChrome params={params} />
      </Suspense>
      {children}
    </main>
  );
}
