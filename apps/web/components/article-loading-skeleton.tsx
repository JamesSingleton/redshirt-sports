import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

export default function ArticlePageSkeleton() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="mx-auto max-w-site px-4 lg:px-6"
    >
      <span className="sr-only" role="status">Loading…</span>
      <div aria-hidden="true">
        <Skeleton className="mt-5 h-3 w-48" />
        <div className="grid gap-10 pt-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-12 w-full max-w-3xl" />
            <Skeleton className="mt-4 h-6 w-full max-w-2xl" />
            <Skeleton className="mt-4 h-6 w-5/6 max-w-xl" />
            <div className="mt-5 flex items-center gap-3 border-y py-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="grid flex-1 gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
            <Skeleton className="mt-6 aspect-video w-full rounded-xl" />
            <div className="mx-auto mt-8 max-w-prose grid gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
          <div className="hidden gap-6 lg:grid">
            <Skeleton className="h-[250px] w-full rounded-md" />
            <Skeleton className="h-80 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
