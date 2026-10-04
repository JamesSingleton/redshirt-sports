import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

function TeamCardSkeleton() {
  return (
    <div className="bg-card flex items-center gap-3 rounded border p-3">
      <Skeleton className="size-10 shrink-0 rounded" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

function ConferenceSectionSkeleton({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="border-b pb-3">
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }, (_, index) => (
          <TeamCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function TeamsDirectorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading teams">
      <div className="container flex flex-col gap-4 pt-6 pb-6 md:pt-10">
        <Skeleton className="h-4 w-32" />
        <div className="flex max-w-3xl flex-col gap-2">
          <Skeleton className="h-10 w-48 md:h-12" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </div>
      <div className="container flex flex-col gap-8 py-8 pb-12">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-9 w-full rounded-md md:w-96" />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Skeleton className="h-9 w-full rounded-md sm:w-64" />
            <Skeleton className="h-9 w-full rounded-md sm:w-64" />
          </div>
        </div>
        <ConferenceSectionSkeleton count={8} />
        <ConferenceSectionSkeleton count={4} />
      </div>
    </div>
  );
}
