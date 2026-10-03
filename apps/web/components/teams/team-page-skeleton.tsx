import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

function SectionHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3 border-b pb-3">
      <Skeleton className="h-7 w-48" />
    </div>
  );
}

function ArticleRowSkeleton() {
  return (
    <div className="flex gap-4 py-4 first:pt-0">
      <Skeleton className="aspect-video w-28 shrink-0 rounded sm:w-40" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

export function TeamPageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading team">
      <header className="bg-card border-b">
        <div className="container flex items-center gap-4 py-6 md:gap-6 md:py-8">
          <Skeleton className="size-16 shrink-0 rounded md:size-24" />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Skeleton className="h-9 w-3/4 max-w-md md:h-12" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </header>

      <div className="container grid grid-cols-1 gap-8 py-8 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-10 lg:col-span-8">
          <section className="flex flex-col gap-6">
            <SectionHeaderSkeleton />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex flex-col gap-3">
                  <Skeleton className="aspect-video w-full rounded" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <SectionHeaderSkeleton />
            <div className="flex flex-col divide-y">
              {Array.from({ length: 4 }, (_, index) => (
                <ArticleRowSkeleton key={index} />
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <SectionHeaderSkeleton />
            <Skeleton className="h-64 w-full rounded" />
          </section>
        </div>

        <aside className="flex flex-col gap-6 lg:col-span-4">
          <div className="bg-card flex flex-col gap-4 rounded border p-4">
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
