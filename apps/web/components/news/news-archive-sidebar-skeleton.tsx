import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

export function NewsArchiveSidebarSkeleton() {
  return (
    <aside
      className="grid content-start gap-6"
      aria-hidden
      aria-label="Loading sidebar"
    >
      <Skeleton className="h-80 w-full rounded-xl" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </aside>
  );
}
