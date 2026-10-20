import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

export function RankingsWeekChromeSkeleton() {
  return (
    <div className="pt-5 motion-reduce:animate-none" aria-busy="true">
      <span className="sr-only" role="status">Loading rankings…</span>
      <Skeleton className="h-4 w-48" />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="mt-5 flex gap-6 border-b pb-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={`tab-${i}`} className="h-4 w-16" />
        ))}
      </div>
    </div>
  );
}
