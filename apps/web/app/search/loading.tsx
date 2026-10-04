import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

import { CardGridSkeleton } from "@/components/news/news-listing-skeleton";

export default function Loading() {
  return (
    <div aria-busy="true">
      <div className="container flex flex-col gap-4 pt-6 pb-6 md:pt-10">
        <Skeleton className="h-11 w-48" />
        <Skeleton className="h-6 w-72" />
        <Skeleton className="h-9 w-full max-w-xl" />
      </div>
      <div className="container pb-12">
        <CardGridSkeleton />
      </div>
    </div>
  );
}
