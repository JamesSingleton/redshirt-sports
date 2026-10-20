import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-site px-4 lg:px-6">
      <div className="border-b pb-5 pt-5">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-4 h-4 w-20" />
        <Skeleton className="mt-3 h-12 w-full max-w-xl" />
        <Skeleton className="mt-2 h-5 w-full max-w-md" />
      </div>
      <Skeleton className="mt-5 h-24 w-full rounded-xl" />
      <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="mx-auto h-[250px] w-full max-w-[300px] rounded-md" />
        </div>
      </div>
    </div>
  );
}
