import type { SportParam } from "@redshirt-sports/clients/espn";
import {
  getSportIdBySlug,
  getVotesForWeekAndYearByVoter,
} from "@redshirt-sports/db/queries";
import { cacheLife, cacheTag } from "next/cache";

import { isLeftOffTop25, isOutlierPick } from "@/lib/ballot-outliers";
import { TOP_25 } from "@/lib/constants";
import {
  getCachedFinalRankings,
  getCachedPollWeekBallotContext,
  RANKINGS_CACHE_LIFE,
  RANKINGS_CACHE_TAG,
  rankingsDivisionTag,
  rankingsSportTag,
  rankingsWeekTag,
} from "@/lib/rankings-data";
import { voterBallotSlug } from "@/lib/voter-ballot-slug";

export type BallotsMatrixVoter = {
  userId: string;
  slug: string;
  label: string;
  shortLabel: string;
};

export type BallotsMatrixCell = {
  rank: number | null;
  isOutlier: boolean;
  isLeftOff: boolean;
};

export type BallotsMatrixRow = {
  teamId: string;
  name: string;
  shortName: string;
  abbreviation: string;
  image: unknown;
  publishedRank: number | null;
  points: number;
  firstPlaceVotes: number;
  isReceivingVotesOnly: boolean;
  ballotsOn: number;
  rankMin: number | null;
  rankMax: number | null;
  cells: BallotsMatrixCell[];
};

export type BallotsPageMatrix = {
  voters: BallotsMatrixVoter[];
  rows: BallotsMatrixRow[];
  ballotsCounted: number;
  panelSize: number;
  unanimousTeamCount: number;
  topFirstPlaceVotes: number;
  outlierPickCount: number;
  leftOffCount: number;
};

function voterShortLabel(firstName: string, lastName: string): string {
  const initial = firstName.trim().charAt(0);
  const last = lastName.trim().split(/\s+/).pop() ?? lastName;
  return `${initial}. ${last}`.trim();
}

function voterDisplayLabel(
  firstName: string,
  lastName: string,
  organization: string | null,
): string {
  const name = `${firstName} ${lastName}`.trim();
  if (organization) {
    return `${name} · ${organization}`;
  }
  return name;
}

export async function getCachedBallotsPageMatrix({
  year,
  week,
  division,
  sport,
}: {
  year: number;
  week: number;
  division: string;
  sport: SportParam;
}): Promise<BallotsPageMatrix | null> {
  "use cache";
  cacheTag(
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sport),
    rankingsDivisionTag(sport, division),
    rankingsWeekTag(sport, division, year, week),
  );
  cacheLife(RANKINGS_CACHE_LIFE);

  const sportId = await getSportIdBySlug(sport);
  if (!sportId) {
    return null;
  }

  const [rankingsResult, ballotContext, votesByVoter] = await Promise.all([
    getCachedFinalRankings({ year, week, division, sport }),
    getCachedPollWeekBallotContext({ year, week, division, sport }),
    getVotesForWeekAndYearByVoter({ year, week, division, sportId }),
  ]);

  const { rankings } = rankingsResult;
  const ballotsListed =
    ballotContext?.ballotsListedBySanityId ?? Object.create(null);
  const ballotsCounted = ballotContext?.ballotsCounted ?? 0;

  const voterEntries = Object.entries(votesByVoter)
    .map(([userId, entry]) => {
      const user = entry.userData;
      if (!user) return null;
      const firstName = user.firstName ?? "";
      const lastName = user.lastName ?? "";
      const name = `${firstName} ${lastName}`.trim();
      return {
        userId,
        slug: voterBallotSlug(name),
        label: voterDisplayLabel(firstName, lastName, user.organization),
        shortLabel: voterShortLabel(firstName, lastName),
      };
    })
    .filter((v): v is BallotsMatrixVoter => v !== null)
    .sort((a, b) => a.label.localeCompare(b.label));

  if (voterEntries.length === 0) {
    return null;
  }

  const publishedRankById = new Map<string, number | null>();
  for (const team of rankings) {
    publishedRankById.set(team._id, team.rank);
  }

  const voterRankMaps = voterEntries.map(({ userId }) => {
    const ballot = votesByVoter[userId]?.votes ?? [];
    const byTeam = new Map<string, number>();
    for (const vote of ballot) {
      if (!byTeam.has(vote.teamId)) {
        byTeam.set(vote.teamId, vote.rank);
      }
    }
    return byTeam;
  });

  const top25 = rankings.filter((t) => t.rank != null && t.rank <= TOP_25);
  const receivingVotes = rankings.filter(
    (t) => t.rank == null || t.rank > TOP_25,
  );

  const rowTeams = [...top25, ...receivingVotes];

  let outlierPickCount = 0;
  let leftOffCount = 0;
  const rows: BallotsMatrixRow[] = rowTeams.map((team) => {
    const publishedRank = team.rank;
    const ranks: number[] = [];
    const cells: BallotsMatrixCell[] = voterRankMaps.map((byTeam) => {
      const voterRank = byTeam.get(team._id) ?? null;
      if (voterRank != null) {
        ranks.push(voterRank);
      }
      const isOutlier = isOutlierPick({
        voterRank,
        publishedRank,
      });
      const isLeftOff = isLeftOffTop25({
        voterRank,
        publishedRank,
      });
      if (isOutlier) {
        outlierPickCount += 1;
      }
      if (isLeftOff) {
        leftOffCount += 1;
      }
      return { rank: voterRank, isOutlier, isLeftOff };
    });

    const rankMin = ranks.length > 0 ? Math.min(...ranks) : null;
    const rankMax = ranks.length > 0 ? Math.max(...ranks) : null;

    return {
      teamId: team._id,
      name: team.name,
      shortName: team.shortName,
      abbreviation: team.abbreviation,
      image: team.image,
      publishedRank,
      points: team._points,
      firstPlaceVotes: team.firstPlaceVotes ?? 0,
      isReceivingVotesOnly: publishedRank == null || publishedRank > TOP_25,
      ballotsOn: ballotsListed[team._id] ?? 0,
      rankMin,
      rankMax,
      cells,
    };
  });

  const unanimousTeamCount = rows.filter(
    (row) => row.ballotsOn === ballotsCounted && ballotsCounted > 0,
  ).length;

  const numberOne = top25.find((t) => t.rank === 1);
  const topFirstPlaceVotes = numberOne?.firstPlaceVotes ?? 0;

  return {
    voters: voterEntries,
    rows,
    ballotsCounted,
    panelSize: voterEntries.length,
    unanimousTeamCount,
    topFirstPlaceVotes,
    outlierPickCount,
    leftOffCount,
  };
}
