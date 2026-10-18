import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

function StoryRowSkeleton() {
  return (
    <div className="grid grid-cols-[1fr_7.5rem] gap-4 py-4 sm:grid-cols-[1fr_11rem]">
      <div className="space-y-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-4/5" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="aspect-[4/3] w-full rounded-md" />
    </div>
  );
}

function TopStorySkeleton() {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3 pb-4">
      <Skeleton className="aspect-[4/3] w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <section className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-8">
      <div>
        <Skeleton className="aspect-[16/9] w-full rounded-xl lg:aspect-[2/1]" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-full lg:h-14" />
          <Skeleton className="h-9 w-3/4 lg:h-14" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="size-6 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
      <div className="grid content-start gap-4 lg:border-l lg:pl-8">
        <Skeleton className="h-3 w-24" />
        <TopStorySkeleton />
        <TopStorySkeleton />
        <TopStorySkeleton />
      </div>
    </section>
  );
}

function LatestSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between border-b pb-3">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="hidden h-9 w-64 rounded-lg sm:block" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 4 }, (_, index) => (
          <StoryRowSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

function AsideSkeleton() {
  return (
    <div className="grid content-start gap-6">
      <Skeleton className="h-96 w-full rounded-xl" />
      <Skeleton className="h-44 w-full rounded-xl" />
      <Skeleton className="min-h-[250px] w-full max-w-[300px] rounded-md" />
    </div>
  );
}

export default function HomePageSkeleton() {
  return (
    <div className="max-w-site mx-auto px-4 lg:px-6">
      <HeroSkeleton />
      <div className="my-8 flex justify-center">
        <Skeleton className="min-h-[90px] w-full max-w-[970px] rounded-md" />
      </div>
      <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <LatestSkeleton />
        <AsideSkeleton />
      </section>
    </div>
  );
}
