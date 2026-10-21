import Link from "next/link";

import { AdSlot } from "@/components/ad-slot";
import { JsonLdScript } from "@/components/json-ld";
import { RankingsBallotsCta } from "@/components/rankings/rankings-ballots-cta";
import { RankingsBeyondTop25 } from "@/components/rankings/rankings-beyond-top-25";
import { RankingsBiggestMovers } from "@/components/rankings/rankings-biggest-movers";
import { RankingsMovementLegend } from "@/components/rankings/rankings-movement-legend";
import { RankingsPollTable } from "@/components/rankings/rankings-poll-table";
import type { RankingsWeekPageModel } from "@/lib/rankings/read-model/week-page-model";

export function RankingsWeekPageBody({
  model,
}: {
  model: RankingsWeekPageModel;
}) {
  const {
    jsonLd,
    ballotsCounted,
    voterWord,
    ballotWord,
    titleWeek,
    top25Count,
    pollTableTeams,
    biggestMovers,
    moversSubtitle,
    ballotsHref,
    byVoterHref,
    methodologyHref,
    voterChips,
    outsideTop25,
    droppedOutOfTop25,
    noLongerReceivingVotes,
    currentRankingsById,
    ballotsListedBySanityId,
    sport,
    division,
    year,
    weekSegment,
  } = model;

  return (
    <>
      <JsonLdScript
        data={jsonLd}
        id={`json-ld-${sport}-${division}-${year}-${weekSegment}`}
      />
      {ballotsCounted > 0 ? (
        <p className="pt-4 text-sm text-muted-foreground">
          {ballotsCounted} {voterWord} · {ballotsCounted} {ballotWord} counted
        </p>
      ) : null}

      {top25Count > 0 ? (
        <>
          <div className="grid gap-8 pt-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="grid content-start gap-4">
              <RankingsBallotsCta
                variant="mobile"
                ballotsHref={ballotsHref}
                byVoterHref={byVoterHref}
                ballotsCounted={ballotsCounted}
                voterChips={voterChips}
                weekLabel={titleWeek}
              />
              <RankingsPollTable
                teams={pollTableTeams}
                ballotsCounted={ballotsCounted}
                methodologyHref={methodologyHref}
              />
              <RankingsMovementLegend />
            </div>
            <aside className="grid content-start gap-6">
              <RankingsBallotsCta
                variant="desktop"
                ballotsHref={ballotsHref}
                byVoterHref={byVoterHref}
                ballotsCounted={ballotsCounted}
                voterChips={voterChips}
                weekLabel={titleWeek}
              />
              <RankingsBiggestMovers
                movers={biggestMovers}
                weekComparisonLabel={moversSubtitle}
              />
              <AdSlot
                width={300}
                height={250}
                className="mx-auto hidden lg:flex"
              />
            </aside>
          </div>
          <RankingsBeyondTop25
            othersReceivingVotes={outsideTop25}
            droppedOut={droppedOutOfTop25}
            noLongerReceivingVotes={noLongerReceivingVotes}
            ballotsCounted={ballotsCounted}
            currentRankingsById={currentRankingsById}
            ballotsListedBySanityId={ballotsListedBySanityId}
          />
        </>
      ) : (
        <div className="mx-auto max-w-md py-16 text-center">
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            Top 25 Poll Not Found
          </h2>
          <p className="text-muted-foreground mt-4">
            We&apos;re sorry, but the selected Top 25 poll could not be found.
            Please try again or check back later.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              prefetch={false}
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Go back Home
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
