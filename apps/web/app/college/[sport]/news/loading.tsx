import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

export default function Loading() {
  return (
    <>
      <div className="from-muted/60 to-background border-b bg-gradient-to-b">
        <div className="max-w-site mx-auto px-4 pt-5 pb-6 lg:px-6">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-4 h-12 w-3/4 max-w-xl rounded" />
        </div>
      </div>
      <div className="max-w-site mx-auto px-4 pb-12 lg:px-6">
        <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="divide-y">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_7.5rem] gap-4 py-4 sm:grid-cols-[1fr_11rem]"
              >
                <div className="space-y-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-4/5" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="aspect-[4/3] w-full rounded-md" />
              </div>
            ))}
          </div>
          <div className="grid content-start gap-6">
            <Skeleton className="h-96 w-full rounded-xl" />
            <Skeleton className="min-h-[250px] w-full max-w-[300px] rounded-md" />
          </div>
        </div>
      </div>
    </>
  );
}
