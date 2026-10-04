import { Skeleton } from "@redshirt-sports/ui/components/skeleton";
import { cn } from "@redshirt-sports/ui/lib/utils";

export function NewsListingSkeleton() {
  return (
    <div aria-busy="true">
      <div className="container flex flex-col gap-4 pt-6 pb-6 md:pt-10">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-11 w-2/3 max-w-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>
      <div className="container grid grid-cols-1 gap-8 pb-12 lg:grid-cols-12">
        <div className="flex flex-col gap-10 lg:col-span-8">
          <Skeleton className="aspect-4/3 w-full rounded-md sm:aspect-video" />
          <CardGridSkeleton count={4} className="lg:grid-cols-2" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-96 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function CardGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex flex-col gap-3">
          <Skeleton className="aspect-video w-full rounded-md" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}
