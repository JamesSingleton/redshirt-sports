import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

export function BracketSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-site flex-col gap-4 px-4 py-6 lg:px-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-80 max-w-full" />
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
