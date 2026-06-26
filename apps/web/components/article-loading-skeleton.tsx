import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

export default function ArticlePageSkeleton() {
  return (
    <div aria-busy="true">
      <p className="sr-only">Loading article...</p>
      <div className="container max-w-screen-xl px-4 py-10 md:px-8">
        <article className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <div className="mb-4">
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            <div className="mb-6 max-w-2xl space-y-2">
              <Skeleton className="h-9 w-full md:h-10" />
              <Skeleton className="h-9 w-5/6 md:h-10" />
              <Skeleton className="h-9 w-3/4 md:h-10" />
            </div>

            <div className="mb-7 flex items-start gap-2 border-border border-y py-4 sm:items-center sm:gap-3 sm:py-5">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0 self-center">
                <Skeleton className="size-8 rounded-md sm:size-9" />
                <Skeleton className="size-8 rounded-md sm:size-9" />
                <Skeleton className="size-8 rounded-md sm:size-9" />
                <Skeleton className="size-8 rounded-md sm:size-9" />
              </div>
            </div>

            <Skeleton className="mb-7 aspect-video w-full rounded-lg" />

            <div className="max-w-2xl space-y-3 md:prose-base">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={`article-body-skeleton-${index.toString()}`}
                  className="space-y-2"
                >
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <Skeleton className="h-5 w-44" />
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={`related-article-skeleton-${index.toString()}`}
                  className="py-4"
                >
                  <Skeleton className="mb-2 h-3 w-16" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-16 w-24 shrink-0 rounded sm:h-14 sm:w-20" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3.5 w-4/5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </article>
      </div>
    </div>
  );
}
