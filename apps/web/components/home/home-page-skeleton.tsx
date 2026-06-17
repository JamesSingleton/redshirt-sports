import { Skeleton } from "@redshirt-sports/ui/components/skeleton";
import { cn } from "@redshirt-sports/ui/lib/utils";

function ArticleCardSkeleton({
  headingClassName,
}: {
  headingClassName?: string;
}) {
  return (
    <div className="border-border overflow-hidden rounded-lg border shadow-lg">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="bg-background space-y-2 p-4">
        <Skeleton className={cn("h-5 w-full", headingClassName)} />
        <Skeleton className="h-5 w-4/5" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
      <div className="container">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="aspect-2/1 w-full rounded-lg shadow-md" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-8 w-full lg:h-12" />
              <Skeleton className="h-8 w-3/4 lg:h-12" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-0 lg:grid-cols-1">
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
          </div>
        </div>
      </div>
    </section>
  );
}

function LatestNewsSkeleton() {
  return (
    <section className="pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
      <div className="container">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <ArticleCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ArticleSectionSkeleton({
  imageFirst = false,
}: {
  imageFirst?: boolean;
}) {
  return (
    <section className="pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
      <div className="container">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
        <div className="flex flex-col gap-4 pt-4 md:flex-row">
          <div
            className={cn(
              "order-1 space-y-2 md:flex md:w-1/2 md:items-center xl:w-1/3",
              imageFirst ? "md:order-2" : "md:order-1",
            )}
          >
            <div className="space-y-2 md:flex-1">
              <Skeleton className="h-9 w-full lg:h-10" />
              <Skeleton className="h-9 w-4/5 lg:h-10" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-11/12" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
          <div
            className={cn(
              "md:w-1/2 xl:w-2/3",
              imageFirst ? "md:order-1" : "md:order-2",
            )}
          >
            <Skeleton className="aspect-3/2 w-full rounded-lg shadow-md" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <ArticleCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePageSkeleton() {
  return (
    <>
      <HeroSkeleton />
      <LatestNewsSkeleton />
      <ArticleSectionSkeleton />
      <ArticleSectionSkeleton imageFirst />
    </>
  );
}
