"use client";

import { Badge } from "@redshirt-sports/ui/components/badge";
import { Button } from "@redshirt-sports/ui/components/button";
import { Card } from "@redshirt-sports/ui/components/card";
import { Input } from "@redshirt-sports/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@redshirt-sports/ui/components/tooltip";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { BallotDiffChip } from "@/components/rankings/ballot-diff-chip";
import { BallotMatchRadial } from "@/components/rankings/ballot-match-radial";
import { TeamMark } from "@/components/rankings/team-mark";
import { OUTLIER_RANK_GAP } from "@/lib/ballot-outliers";
import { describeBallotPickContext } from "@/lib/ballot-pick-context";
import type { VoterBallotCardData } from "@/lib/ballots-by-voter-data";

const PAGE_SIZE = 6;

type SortKey = "outliers" | "closest" | "farthest" | "name";

function VoterBallotCard({
  card,
  ballotsHrefBase,
}: {
  card: VoterBallotCardData;
  ballotsHrefBase: string;
}) {
  return (
    <Card
      id={card.slug}
      className="min-w-0 scroll-mt-24 gap-0 overflow-x-clip shadow-xs"
    >
      <div className="flex items-start gap-3 px-4 pt-5 sm:px-5">
        <BallotMatchRadial percent={card.matchPercent} size="md" />
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold sm:text-lg">{card.name}</div>
          <div className="truncate text-sm text-muted-foreground">
            {card.organization}
            {card.organizationRole ? ` · ${card.organizationRole}` : ""}
          </div>
        </div>
        <Link
          href={`${ballotsHrefBase}?voter=${card.slug}`}
          prefetch={false}
          className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-sm font-medium hover:bg-accent"
        >
          Matrix
          <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <div className="flex min-w-0 flex-wrap gap-1.5 px-4 pt-3 sm:px-5">
        <Badge variant="secondary">
          Avg. gap {card.avgGap.toFixed(1)} spots
        </Badge>
        <Badge
          variant="outline"
          className={cn(card.outlierCount > 0 && "border-gold")}
        >
          {card.outlierCount} outlier{card.outlierCount === 1 ? "" : "s"}
        </Badge>
        <Badge variant="outline">
          {card.consensusTop25Count} of 25 in the consensus Top 25
        </Badge>
      </div>
      <ol
        className="grid min-w-0 grid-cols-1 gap-1 px-4 pt-3 sm:grid-cols-2 sm:grid-flow-col sm:grid-rows-[repeat(13,auto)] sm:gap-x-4"
        aria-label={`${card.name} full ballot`}
      >
        {card.picks.map((pick) => (
          <Tooltip key={pick.teamId}>
            <TooltipTrigger asChild>
              <li
                className={cn(
                  "flex min-w-0 cursor-default items-center gap-2 rounded-md px-2 py-1 text-sm sm:py-1.5 sm:text-[15px]",
                  pick.isOutlier && "bg-gold/15 ring-1 ring-inset ring-gold",
                )}
              >
                <span className="w-6 text-right font-display text-base font-bold tabular sm:w-7 sm:text-lg">
                  {pick.voterRank}
                </span>
                <span className="inline-flex sm:hidden">
                  <TeamMark
                    image={pick.image}
                    shortName={pick.shortName}
                    abbreviation={pick.abbreviation}
                    name={pick.name}
                    size="sm"
                  />
                </span>
                <span className="hidden sm:inline-flex">
                  <TeamMark
                    image={pick.image}
                    shortName={pick.shortName}
                    abbreviation={pick.abbreviation}
                    name={pick.name}
                    size="md"
                  />
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {pick.shortName}
                </span>
                <BallotDiffChip diff={pick.diff} />
              </li>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-sm">
              {describeBallotPickContext(pick)}
            </TooltipContent>
          </Tooltip>
        ))}
      </ol>
      <div className="mt-3 grid gap-1 border-t px-4 py-3 text-muted-foreground sm:px-5">
        {card.omittedTop25.length > 0 ? (
          <p className="text-sm">
            <span className="font-semibold text-foreground">
              Left off the ballot (but in the published Top 25):
            </span>{" "}
            {card.omittedTop25
              .map((t) => `${t.shortName} (No. ${t.consensusRank})`)
              .join(", ")}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Included every team in the published Top 25 this week.
          </p>
        )}
      </div>
    </Card>
  );
}

export function BallotsByVoterPanel({
  cards,
  ballotsHref,
  initialVoterSlug,
  byVoterPath,
}: {
  cards: VoterBallotCardData[];
  ballotsHref: string;
  initialVoterSlug?: string | null;
  byVoterPath: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const voterFromUrl = searchParams.get("voter") ?? initialVoterSlug ?? null;

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("outliers");
  const [page, setPage] = useState(1);
  const [focusSlug, setFocusSlug] = useState<string | null>(voterFromUrl);

  useEffect(() => {
    setFocusSlug(voterFromUrl);
    if (voterFromUrl) {
      const match = cards.find((c) => c.slug === voterFromUrl);
      if (match) {
        requestAnimationFrame(() => {
          document
            .getElementById(match.slug)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    }
  }, [voterFromUrl, cards]);

  const filtered = useMemo(() => {
    if (focusSlug) {
      const one = cards.filter((c) => c.slug === focusSlug);
      if (one.length > 0) {
        return one;
      }
    }
    const q = query.trim().toLowerCase();
    let list = cards;
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.organization.toLowerCase().includes(q),
      );
    }
    switch (sort) {
      case "closest":
        return [...list].sort((a, b) => a.avgGap - b.avgGap);
      case "farthest":
        return [...list].sort((a, b) => b.avgGap - a.avgGap);
      case "name":
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return [...list].sort(
          (a, b) => b.outlierCount - a.outlierCount || b.avgGap - a.avgGap,
        );
    }
  }, [cards, focusSlug, query, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageCards = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid min-w-0 content-start gap-4 pt-4">
        {focusSlug ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <span>
              Showing one voter&apos;s ballot.{" "}
              <span className="font-medium text-foreground">
                {cards.find((c) => c.slug === focusSlug)?.name ?? focusSlug}
              </span>
            </span>
            <Link
              href={byVoterPath}
              prefetch={false}
              className="font-medium text-primary hover:underline"
            >
              View all voters
            </Link>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
                setFocusSlug(null);
                if (searchParams.get("voter")) {
                  router.replace(byVoterPath, { scroll: false });
                }
              }}
              placeholder="Search voters or outlets"
              aria-label="Search voters or outlets"
              className="h-9 pl-8"
            />
          </div>
          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v as SortKey);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[11rem]" aria-label="Sort ballots">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="outliers">Sort: most outliers</SelectItem>
              <SelectItem value="closest">Closest to consensus</SelectItem>
              <SelectItem value="farthest">Farthest from consensus</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
            </SelectContent>
          </Select>
          <span className="ml-auto hidden text-sm text-muted-foreground sm:block">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </span>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
          <span>Diff vs consensus:</span>
          <BallotDiffChip diff={3} />
          <span>ranked higher</span>
          <BallotDiffChip diff={-2} />
          <span>ranked lower</span>
          <BallotDiffChip diff="equal" />
          <span>same spot</span>
          <BallotDiffChip diff="rv" />
          <span>team outside the Top 25</span>
          <span className="inline-flex items-center gap-1">
            <span className="size-3 rounded-sm bg-gold/15 ring-1 ring-inset ring-gold" />
            outlier ({OUTLIER_RANK_GAP}+ spots from the published rank)
          </span>
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          {pageCards.map((card) => (
            <VoterBallotCard
              key={card.userId}
              card={card}
              ballotsHrefBase={ballotsHref}
            />
          ))}
        </div>

        {pageCount > 1 ? (
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm tabular">
              Page {safePage} of {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={safePage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
