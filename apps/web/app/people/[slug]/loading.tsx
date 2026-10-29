import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

export default function PersonRouteLoading() {
  return (
    <div
      className="mx-auto max-w-site px-4 py-6 lg:px-6"
      aria-busy="true"
      aria-labelledby="person-loading-heading"
    >
      <span className="sr-only" id="person-loading-heading" role="status">
        Loading profile…
      </span>
      <Skeleton className="h-3 w-40 motion-reduce:animate-none" aria-hidden />
      <div className="mt-5 flex gap-6 sm:items-start">
        <Skeleton
          className="size-28 shrink-0 rounded-full sm:size-36 motion-reduce:animate-none"
          aria-hidden
        />
        <div className="flex-1 space-y-2">
          <Skeleton
            className="h-4 w-28 motion-reduce:animate-none"
            aria-hidden
          />
          <Skeleton
            className="h-12 w-full max-w-lg motion-reduce:animate-none"
            aria-hidden
          />
          <Skeleton
            className="h-4 w-3/4 max-w-md motion-reduce:animate-none"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
