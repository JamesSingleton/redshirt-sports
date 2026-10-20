import { Badge } from "@redshirt-sports/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RankingsTabs } from "@/components/rankings/rankings-tabs";
import { getCachedVoterBreakdown } from "@/components/rankings/rankings-voter-breakdown";
import { TOP_25 } from "@/lib/constants";
import { getPageMetadata } from "@/lib/global-seo-settings";
import { getCachedFinalRankings } from "@/lib/rankings-data";
import { parseWeekSegment, type SportParam, weekTitle } from "@/utils/espn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    sport: string;
    division: string;
    year: string;
    week: string;
  }>;
}): Promise<Metadata> {
  const { sport, division, year, week } = await params;
  return getPageMetadata(
    {
      title: `Ballots by voter · ${division.toUpperCase()} ${year}`,
      description: "Each voter's full ballot compared to the consensus poll.",
      slug: `/college/${sport}/rankings/${division}/${year}/${week}/ballots/by-voter`,
    },
    "published",
  );
}

export default async function BallotsByVoterPage({
  params,
}: {
  params: Promise<{
    sport: string;
    division: string;
    year: string;
    week: string;
  }>;
}) {
  const { sport, division, year, week } = await params;
  if (!/^\d{4}$/.test(year)) notFound();
  let weekNumber: number;
  try {
    weekNumber = parseWeekSegment(week);
  } catch {
    notFound();
  }

  const sportParam = sport as SportParam;
  const result = await getCachedFinalRankings({
    year: Number(year),
    week: weekNumber,
    division,
    sport: sportParam,
  }).catch(() => null);
  if (!result) notFound();

  const consensus = result.rankings
    .filter((team) => (team.rank ?? 0) <= TOP_25)
    .map((team) => ({ id: team._id, rank: team.rank as number }));

  const voters = await getCachedVoterBreakdown({
    division,
    year: Number(year),
    week: weekNumber,
    sport: sportParam,
    consensusRanks: consensus,
  });

  return (
    <div className="max-w-site mx-auto px-4 py-8 lg:px-6">
      <div className="kicker text-primary">
        Redshirt Sports Poll · {division.toUpperCase()}
      </div>
      <h1 className="font-display mt-1 text-3xl font-extrabold tracking-tight uppercase">
        Ballots by voter
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {year} {weekTitle(weekNumber)}. Match percent compares each ballot to
        the published Top 25.
      </p>
      <RankingsTabs
        sport={sport}
        division={division}
        year={year}
        week={week}
        active="ballots"
      />
      <div className="mt-6 grid gap-4">
        {(voters ?? []).map((voter) => (
          <Card key={`${voter.name}-${voter.organization}`}>
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle className="font-display text-xl font-bold uppercase">
                  {voter.name}
                </CardTitle>
                {voter.organization ? (
                  <p className="text-muted-foreground text-sm">
                    {voter.organization}
                  </p>
                ) : null}
              </div>
              <Badge variant="secondary">{voter.matchPercent}% match</Badge>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-1 sm:grid-cols-2">
                {voter.ballot.slice(0, 25).map((team, index) => (
                  <li
                    key={team._id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="font-display w-6 text-right font-bold tabular">
                      {index + 1}
                    </span>
                    <span className="truncate font-medium">
                      {team.shortName ?? team.name}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
        {!voters?.length ? (
          <p className="text-muted-foreground text-sm">
            No ballots are published for this week yet.
          </p>
        ) : null}
      </div>
      <Link
        href={`/college/${sport}/rankings/${division}/${year}/${week}/ballots`}
        className="text-primary mt-6 inline-block text-sm font-medium hover:underline"
        prefetch={false}
      >
        Back to ballot matrix
      </Link>
    </div>
  );
}
