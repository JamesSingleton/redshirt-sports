import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

import { DivisionTop25CardSkeleton } from "@/components/rankings/top25-card";

/** Matches the `[0...5]` slice in the related-posts query. */
const RELATED_ROWS = 5;

export default function ArticlePageSkeleton() {
  return (
    <div
      aria-busy="true"
      className="container grid gap-10 py-6 md:py-10 lg:grid-cols-[minmax(0,48rem)_minmax(20rem,28rem)] lg:justify-between xl:gap-14"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 lg:mx-0 lg:max-w-none">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full md:h-12" />
          <Skeleton className="h-10 w-3/4 md:h-12" />
        </div>
        <Skeleton className="h-6 w-full" />
        <div className="border-border flex items-center gap-3 border-y py-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="aspect-video w-full rounded-md" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-full last:w-2/3" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
        <div className="bg-card overflow-hidden rounded-md border">
          <div className="border-brand border-l-4 px-4 py-3">
            <Skeleton className="h-5 w-44" />
          </div>
          <ul className="divide-y">
            {Array.from({ length: RELATED_ROWS }, (_, index) => (
              <li
                key={index}
                className="grid grid-cols-[7rem_1fr] items-start gap-3 px-4 py-3"
              >
                <Skeleton className="aspect-video w-full rounded-md" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <DivisionTop25CardSkeleton />
      </div>
    </div>
  );
}
