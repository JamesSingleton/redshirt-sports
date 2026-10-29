import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

export default function RankingsIndexRouteLoading() {
  return (
    <div className="mx-auto max-w-site px-4 pb-12 lg:px-6" aria-busy="true">
      <span className="sr-only" role="status">
        Loading…
      </span>
      <div className="pt-5">
        <Skeleton className="h-3 w-56 motion-reduce:animate-none" aria-hidden />
        <Skeleton
          className="mt-3 h-4 w-32 motion-reduce:animate-none"
          aria-hidden
        />
        <Skeleton
          className="mt-2 h-12 w-full max-w-sm motion-reduce:animate-none"
          aria-hidden
        />
        <Skeleton
          className="mt-2 h-4 w-full max-w-xl motion-reduce:animate-none"
          aria-hidden
        />
      </div>
      <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid content-start gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-80 rounded-xl motion-reduce:animate-none"
              aria-hidden
            />
          ))}
        </div>
        <Skeleton
          className="mx-auto h-[250px] w-full max-w-[300px] motion-reduce:animate-none"
          aria-hidden
        />
      </div>
    </div>
  );
}
