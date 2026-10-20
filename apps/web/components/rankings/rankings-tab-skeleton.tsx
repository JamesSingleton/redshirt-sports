import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

export default function RankingsTabSkeleton({
  variant = "poll",
}: {
  variant?: "poll" | "ballots" | "voters" | "history" | "methodology";
}) {
  return (
    <div className="pt-6" aria-busy="true">
      <span className="sr-only" role="status">
        Loading…
      </span>
      <div className="motion-reduce:animate-none" aria-hidden>
        <div className="pt-2">
          {variant === "ballots" ? (
            <Skeleton className="h-[28rem] w-full rounded-xl" />
          ) : variant === "methodology" ? (
            <div className="grid gap-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : (
            <Skeleton className="h-64 w-full rounded-xl" />
          )}
        </div>
      </div>
    </div>
  );
}
