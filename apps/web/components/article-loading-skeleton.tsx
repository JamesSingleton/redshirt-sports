import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

export default function ArticlePageSkeleton() {
  return (
    <div className="max-w-site mx-auto animate-pulse px-4 lg:px-6">
      <Skeleton className="mt-5 h-4 w-48" />
      <div className="grid gap-10 pt-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-12 w-4/5 lg:h-16" />
          <Skeleton className="mt-2 h-12 w-3/5 lg:h-16" />
          <div className="mt-4 max-w-3xl space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
          </div>

          <div className="mt-5 flex items-center gap-3 border-y py-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="ml-auto h-8 w-24" />
          </div>

          <Skeleton className="mt-6 aspect-video w-full rounded-xl" />

          <div className="mx-auto mt-8 max-w-prose space-y-5">
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <Skeleton className="mt-8 h-8 w-2/3" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </article>
        <aside className="hidden content-start gap-6 lg:grid">
          <Skeleton className="min-h-[250px] w-full max-w-[300px] rounded-md" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </aside>
      </div>

      <div className="fixed right-8 bottom-8 z-50">
        <div className="bg-background border-border rounded-lg border px-4 py-2 shadow-lg">
          <div className="text-muted-foreground flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span className="text-sm">Loading article...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
