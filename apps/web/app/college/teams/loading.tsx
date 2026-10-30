import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

export default function CollegeTeamsLoading() {
  return (
    <>
      <div className="border-b bg-gradient-to-b from-muted/60 to-background">
        <div className="mx-auto max-w-site px-4 pt-5 pb-6 lg:px-6">
          <Skeleton
            className="h-3 w-40 motion-reduce:animate-none"
            aria-hidden
          />
          <Skeleton
            className="mt-3 h-12 w-full max-w-md motion-reduce:animate-none"
            aria-hidden
          />
          <Skeleton
            className="mt-2 h-4 w-full max-w-xl motion-reduce:animate-none"
            aria-hidden
          />
        </div>
      </div>
      <div className="mx-auto max-w-site px-4 lg:px-6" aria-busy="true">
        <span className="sr-only" role="status">
          Loading…
        </span>
        <div className="sticky top-14 z-20 -mx-4 border-b bg-background/95 px-4 py-3 lg:top-16 lg:-mx-6 lg:px-6">
          <Skeleton
            className="h-9 w-full max-w-md motion-reduce:animate-none"
            aria-hidden
          />
        </div>
        <div className="grid gap-8 py-6">
          <Skeleton
            className="h-8 w-12 motion-reduce:animate-none"
            aria-hidden
          />
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,17rem),1fr))]">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-[4.5rem] rounded-xl motion-reduce:animate-none"
                aria-hidden
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
