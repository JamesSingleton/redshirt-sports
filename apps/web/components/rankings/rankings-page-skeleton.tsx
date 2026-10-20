export default function RankingsPageSkeleton() {
  return (
    <main className="mx-auto max-w-site px-4 lg:px-6">
      <div className="pt-5">
        <div className="bg-muted h-4 w-48 animate-pulse rounded" />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="bg-muted h-3 w-40 animate-pulse rounded" />
            <div className="bg-muted h-10 w-full max-w-md animate-pulse rounded" />
            <div className="bg-muted h-4 w-72 animate-pulse rounded" />
          </div>
          <div className="flex gap-2">
            <div className="bg-muted h-9 w-24 animate-pulse rounded-md" />
            <div className="bg-muted h-9 w-28 animate-pulse rounded-md" />
            <div className="bg-muted size-9 animate-pulse rounded-md" />
          </div>
        </div>
      </div>
      <div className="mt-5 flex gap-6 border-b pb-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={`tab-skel-${i}`}
            className="bg-muted h-4 w-16 animate-pulse rounded"
          />
        ))}
      </div>
      <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="bg-muted h-80 animate-pulse rounded-xl" />
          <div className="bg-muted h-6 w-64 animate-pulse rounded" />
        </div>
        <div className="hidden space-y-6 lg:block">
          <div className="bg-muted h-64 animate-pulse rounded-xl" />
          <div className="bg-muted h-48 animate-pulse rounded-xl" />
        </div>
      </div>
    </main>
  );
}
