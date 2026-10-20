import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

export default function TeamHubRouteLoading() {
  return (
    <main className="mx-auto max-w-site px-4 pb-12 lg:px-6" aria-busy="true">
      <span className="sr-only" role="status">Loading…</span>
      <Skeleton className="mt-5 h-3 w-48 motion-reduce:animate-none" aria-hidden />
      <div className="mt-4 flex gap-5 border-b pb-6">
        <Skeleton className="size-20 shrink-0 rounded-full motion-reduce:animate-none" aria-hidden />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24 motion-reduce:animate-none" aria-hidden />
          <Skeleton className="h-10 w-full max-w-md motion-reduce:animate-none" aria-hidden />
        </div>
      </div>
      <div className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-8">
          <Skeleton className="h-8 w-32 motion-reduce:animate-none" aria-hidden />
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-48 rounded-xl motion-reduce:animate-none"
                aria-hidden
              />
            ))}
          </div>
          <Skeleton className="h-64 w-full motion-reduce:animate-none" aria-hidden />
        </div>
        <Skeleton
          className="h-72 w-full motion-reduce:animate-none"
          aria-hidden
        />
      </div>
    </main>
  );
}
