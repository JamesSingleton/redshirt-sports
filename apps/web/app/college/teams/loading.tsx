import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

export default function CollegeTeamsLoading() {
  return (
    <div className="container px-4 py-6 lg:py-6">
      <div className="mb-6 space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <Skeleton className="mb-3 h-3.5 w-32" />

      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={`team-row-skeleton-${index.toString()}`}
            className="flex items-center gap-4 px-4 py-3"
          >
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-14 shrink-0 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
