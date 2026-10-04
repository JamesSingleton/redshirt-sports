import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

export default function RankingsPageSkeleton() {
  return (
    <div
      aria-busy="true"
      className="container flex flex-col gap-8 py-6 md:py-10"
    >
      <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between">
        <div className="flex w-full max-w-2xl flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-11 w-56" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="bg-card overflow-hidden rounded-md border lg:col-span-8">
          {Array.from({ length: 12 }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 border-b px-4 py-3 last:border-b-0"
            >
              <Skeleton className="h-7 w-8" />
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-4 w-10" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6 lg:col-span-4">
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
