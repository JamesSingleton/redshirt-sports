import { cn } from "@redshirt-sports/ui/lib/utils";
import { Grid3x3, Users } from "lucide-react";
import Link from "next/link";

export function BallotsViewToggle({
  allBallotsHref,
  byVoterHref,
  active,
}: {
  allBallotsHref: string;
  byVoterHref: string;
  active: "matrix" | "by-voter";
}) {
  return (
    <nav
      className="inline-flex h-9 w-fit items-center rounded-lg bg-muted p-[3px]"
      aria-label="Ballot views"
    >
      <Link
        href={allBallotsHref}
        prefetch={false}
        title={allBallotsHref}
        className={cn(
          "inline-flex h-[calc(100%-1px)] items-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap",
          active === "matrix"
            ? "bg-background text-foreground shadow-sm dark:bg-input/30"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-current={active === "matrix" ? "page" : undefined}
      >
        <Grid3x3 className="size-3.5 shrink-0" aria-hidden />
        All ballots
      </Link>
      <Link
        href={byVoterHref}
        prefetch={false}
        title={byVoterHref}
        className={cn(
          "inline-flex h-[calc(100%-1px)] items-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap",
          active === "by-voter"
            ? "bg-background text-foreground shadow-sm dark:bg-input/30"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-current={active === "by-voter" ? "page" : undefined}
      >
        <Users className="size-3.5 shrink-0" aria-hidden />
        By voter
      </Link>
    </nav>
  );
}
