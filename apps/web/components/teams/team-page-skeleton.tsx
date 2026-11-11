import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

/** Placeholder while a team hub streams in (a team not prerendered at build). */
export function TeamPageSkeleton() {
  return (
    <div
      className="mx-auto max-w-site px-4 py-6 lg:px-6"
      aria-busy="true"
      aria-labelledby="team-loading-heading"
    >
      <span className="sr-only" id="team-loading-heading" role="status">
        Loading team…
      </span>
      <div className="flex items-center gap-5">
        <Skeleton
          className="size-20 shrink-0 rounded-xl sm:size-24 motion-reduce:animate-none"
          aria-hidden
        />
        <div className="flex-1 space-y-2">
          <Skeleton
            className="h-4 w-40 motion-reduce:animate-none"
            aria-hidden
          />
          <Skeleton
            className="h-10 w-full max-w-md motion-reduce:animate-none"
            aria-hidden
          />
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {[0, 1, 2].map((row) => (
            <Skeleton
              key={row}
              className="h-24 w-full motion-reduce:animate-none"
              aria-hidden
            />
          ))}
        </div>
        <Skeleton
          className="h-64 w-full motion-reduce:animate-none"
          aria-hidden
        />
      </div>
    </div>
  );
}
