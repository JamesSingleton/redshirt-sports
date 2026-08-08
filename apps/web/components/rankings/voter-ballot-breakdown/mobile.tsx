"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { VoterBreakdown } from "@/types/votes";
import { BallotMatchBadge } from "./match-badge";
import { SyncedScroll } from "./synced-scroll";
import { TeamLogo } from "./team-logo";

type Props = {
  rows: VoterBreakdown[];
  page: number;
  pageCount: number;
  onPrevAction: () => void;
  onNextAction: () => void;
};

export default function VoterBreakdownMobile({
  rows,
  page,
  pageCount,
  onPrevAction,
  onNextAction,
}: Props) {
  return (
    <div className="block md:hidden">
      <ul className="flex flex-col gap-3">
        {rows.map((voter) => (
          <li
            key={`${voter.name}-${voter.organization}`}
            className="bg-card text-card-foreground rounded-md border p-3"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="leading-tight font-medium">{voter.name}</div>
                <div className="text-muted-foreground text-xs italic">
                  {voter.organization}
                  {voter.organizationRole ? ` (${voter.organizationRole})` : ""}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-muted-foreground text-[10px] leading-none tracking-wide uppercase">
                  Match %
                </span>
                <BallotMatchBadge matchPercent={voter.matchPercent} />
              </div>
            </div>

            <div className="-mx-3">
              <SyncedScroll
                group="mobile-ballots"
                className="px-3"
                aria-label="Voter ballot horizontal scroller"
              >
                <div className="flex snap-x snap-mandatory items-center gap-3">
                  {Array.from({ length: 25 }, (_, i) => i + 1).map((rank) => {
                    const vote = voter.ballot?.[rank - 1];
                    return (
                      <div
                        key={vote?._id ?? `rank-${rank}`}
                        className="flex shrink-0 snap-start flex-col items-center gap-1"
                        aria-label={`Rank ${rank}${vote ? `: ${vote.shortName ?? vote.name}` : ""}`}
                      >
                        <div className="text-muted-foreground text-[10px] leading-none">
                          {rank}
                        </div>
                        {vote ? (
                          <TeamLogo vote={vote} size={36} />
                        ) : (
                          <div className="bg-muted/30 size-9 rounded-sm" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </SyncedScroll>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-muted-foreground text-xs">
          Page {page} of {pageCount}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevAction}
            disabled={page === 1}
          >
            <ChevronLeft className="mr-1 size-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextAction}
            disabled={page === pageCount}
          >
            Next
            <ChevronRight className="ml-1 size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
