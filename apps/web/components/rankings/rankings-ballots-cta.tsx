import { Avatar, AvatarFallback } from "@redshirt-sports/ui/components/avatar";
import { Button } from "@redshirt-sports/ui/components/button";
import { Card, CardContent } from "@redshirt-sports/ui/components/card";
import { ChevronRight, Grid3x3 } from "lucide-react";
import Link from "next/link";

type RankingsBallotsCtaProps = {
  ballotsHref: string;
  byVoterHref: string;
  ballotsCounted: number;
  voterChips: Array<{ id: string; label: string }>;
  weekLabel: string;
  variant: "mobile" | "desktop";
};

export function RankingsBallotsCta({
  ballotsHref,
  byVoterHref,
  ballotsCounted,
  voterChips,
  weekLabel,
  variant,
}: RankingsBallotsCtaProps) {
  const ballotWord = ballotsCounted === 1 ? "ballot" : "ballots";
  const extraVoters = Math.max(0, ballotsCounted - voterChips.length);

  if (variant === "mobile") {
    return (
      <Link
        href={ballotsHref}
        prefetch={false}
        className="flex items-center gap-3 rounded-xl border border-primary/30 bg-accent/50 p-3 lg:hidden"
      >
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Grid3x3 className="size-5" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-display text-lg font-bold uppercase leading-tight">
            See all {ballotsCounted} {ballotWord}
          </span>
          <span className="block text-sm text-muted-foreground">
            Every voter&apos;s full Top 25, outliers flagged
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-primary" aria-hidden />
      </Link>
    );
  }

  return (
    <Card className="hidden gap-0 border-primary/30 bg-accent/30 shadow-xs lg:flex">
      <CardContent className="grid gap-4 p-5">
        <div className="flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Grid3x3 className="size-5" aria-hidden />
          </span>
          <div>
            <div className="kicker text-primary">Ballot transparency</div>
            <div className="font-display text-2xl font-extrabold uppercase leading-none">
              See all {ballotsCounted} {ballotWord}
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Every voter&apos;s full Top 25 for {weekLabel}, side by side, with
          outlier picks flagged. Published with the poll, never before.
        </p>
        {voterChips.length > 0 ? (
          <div className="flex items-center gap-3">
            {voterChips.map((chip) => (
              <Avatar
                key={chip.id}
                className="-ml-2 size-8 ring-2 ring-card first:ml-0"
              >
                <AvatarFallback className="bg-muted text-[0.7em] font-semibold text-muted-foreground">
                  {chip.label}
                </AvatarFallback>
              </Avatar>
            ))}
            {extraVoters > 0 ? (
              <span className="text-sm text-muted-foreground">
                +{extraVoters} more voters
              </span>
            ) : null}
          </div>
        ) : null}
        <Button asChild className="h-10 font-semibold shadow-xs">
          <Link href={ballotsHref} prefetch={false}>
            Open the full ballot breakdown
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </Button>
        <div className="flex items-center justify-between text-sm">
          <Link
            href={byVoterHref}
            prefetch={false}
            className="font-medium text-primary hover:underline"
          >
            Browse by voter
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
