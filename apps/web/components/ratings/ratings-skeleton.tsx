export function RatingsSkeleton() {
  return (
    <div
      className="flex flex-col gap-4 py-6"
      aria-busy="true"
      aria-label="Loading ratings"
    >
      <div className="bg-muted h-4 w-48 animate-pulse rounded" />
      <div className="bg-muted h-10 w-full max-w-xl animate-pulse rounded" />
      <div className="bg-muted h-8 w-full animate-pulse rounded" />
      <div className="bg-muted h-[32rem] w-full animate-pulse rounded-xl" />
    </div>
  );
}
