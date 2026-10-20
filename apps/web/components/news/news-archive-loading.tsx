import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

function RiverRowSkeleton() {
  return (
    <div
      className="grid grid-cols-[4.5rem_1fr_5.5rem] gap-3 border-b py-3 sm:grid-cols-[5.5rem_1fr_7rem]"
      aria-hidden
    >
      <Skeleton className="h-3 w-14" />
      <div className="grid gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="aspect-[4/3] w-full rounded-md" />
    </div>
  );
}

export function NewsArchiveLoading({
  showFilterBar = true,
  showConferencePicker = false,
  filterBarSize = "sport",
}: {
  showFilterBar?: boolean;
  showConferencePicker?: boolean;
  /** College archive filter row includes sport + division + conference. */
  filterBarSize?: "sport" | "college";
}) {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="mx-auto max-w-site px-4 lg:px-6"
    >
      <span className="sr-only" role="status">Loading…</span>
      <div aria-hidden="true">
        <div className="border-b pb-5 pt-5">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-4 h-4 w-20" />
          <Skeleton className="mt-3 h-10 w-full max-w-xl" />
          <Skeleton className="mt-2 h-4 w-full max-w-md" />
          {showConferencePicker ? (
            <Skeleton className="mt-4 h-9 w-48 rounded-md" />
          ) : null}
        </div>
        {showFilterBar ? (
          <div className="pt-5">
            <Skeleton
              className={
                filterBarSize === "college"
                  ? "h-[7.5rem] w-full rounded-xl"
                  : "h-[4.25rem] w-full rounded-xl"
              }
            />
          </div>
        ) : null}
        <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            <div className="grid gap-4 rounded-xl border p-4 sm:grid-cols-[14rem_1fr]">
              <Skeleton className="aspect-[16/9] w-full rounded-lg" />
              <div className="grid content-start gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            </div>
            <Skeleton className="mt-6 h-4 w-40" />
            <div className="mt-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <RiverRowSkeleton key={i} />
              ))}
            </div>
          </div>
          <div className="grid content-start gap-6">
            <Skeleton className="h-80 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
