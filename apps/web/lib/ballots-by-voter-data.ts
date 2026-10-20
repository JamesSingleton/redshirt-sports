import {
  getSportIdBySlug,
  getVotesForWeekAndYearByVoter,
} from "@redshirt-sports/db/queries";
import { cacheLife, cacheTag } from "next/cache";

import {
  ABSENT_RANK,
  computeBallotMatchPercent,
  type ConsensusRank,
} from "@/lib/ballot-match";
import { voterBallotSlug } from "@/lib/voter-ballot-slug";
import { isOutlierPick, OUTLIER_TOP_OMIT_RANK } from "@/lib/ballot-outliers";
import { TOP_25 } from "@/lib/constants";
import {
  getCachedFinalRankings,
  RANKINGS_CACHE_LIFE,
  RANKINGS_CACHE_TAG,
  rankingsDivisionTag,
  rankingsSportTag,
  rankingsWeekTag,
} from "@/lib/rankings-data";
import type { SportParam } from "@/utils/espn";
import { client } from "@redshirt-sports/sanity/client";
import { schoolsByIdsQuery } from "@redshirt-sports/sanity/queries";
import { token } from "@redshirt-sports/sanity/token";

export type BallotPickRow = {
  teamId: string;
  name: string;
  shortName: string;
  abbreviation: string;
  image: unknown;
  voterRank: number;
  consensusRank: number | null;
  diff: number | "rv" | "equal";
  isOutlier: boolean;
};

export type OmittedConsensusTeam = {
  teamId: string;
  shortName: string;
  consensusRank: number;
};

export type VoterBallotCardData = {
  userId: string;
  slug: string;
  name: string;
  organization: string;
  organizationRole: string;
  matchPercent: number;
  picks: BallotPickRow[];
  omittedTop15: OmittedConsensusTeam[];
  avgGap: number;
  outlierCount: number;
  consensusTop25Count: number;
  numberOneShortName: string;
};

function computeDiff(
  voterRank: number,
  consensusRank: number | null,
): BallotPickRow["diff"] {
  if (consensusRank == null || consensusRank > TOP_25) {
    return "rv";
  }
  if (voterRank === consensusRank) {
    return "equal";
  }
  return consensusRank - voterRank;
}

export async function getCachedBallotsByVoterCards({
  year,
  week,
  division,
  sport,
}: {
  year: number;
  week: number;
  division: string;
  sport: SportParam;
}): Promise<VoterBallotCardData[]> {
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
    return [];
  }

  const [{ rankings }, votesByVoter] = await Promise.all([
    getCachedFinalRankings({ year, week, division, sport }),
    getVotesForWeekAndYearByVoter({ year, week, division, sportId }),
  ]);

  const consensusById = new Map<string, ConsensusRank>();
  const publishedRankById = new Map<string, number | null>();
  const teamMeta = new Map<
    string,
    { name: string; shortName: string; abbreviation: string; image: unknown }
  >();

  for (const team of rankings) {
    publishedRankById.set(team._id, team.rank);
    teamMeta.set(team._id, {
      name: team.name,
      shortName: team.shortName,
      abbreviation: team.abbreviation,
      image: team.image,
    });
    if (team.rank != null && team.rank <= TOP_25) {
      consensusById.set(team._id, { id: team._id, rank: team.rank });
    }
  }

  const consensusRanks: ConsensusRank[] = [...consensusById.values()];
  const top15Ids = consensusRanks
    .filter((c) => c.rank <= OUTLIER_TOP_OMIT_RANK)
    .map((c) => c.id);

  const allBallotTeamIds = new Set<string>();
  for (const entry of Object.values(votesByVoter)) {
    for (const vote of entry.votes) {
      allBallotTeamIds.add(vote.teamId);
    }
  }
  const missingIds = [...allBallotTeamIds].filter((id) => !teamMeta.has(id));
  if (missingIds.length > 0) {
    const schools = await client.fetch<
      Array<{
        _id: string;
        name: string;
        shortName: string;
        abbreviation: string;
        image: unknown;
      }>
    >(schoolsByIdsQuery, { ids: missingIds }, { token, perspective: "published" });
    for (const school of schools) {
      teamMeta.set(school._id, {
        name: school.name,
        shortName: school.shortName,
        abbreviation: school.abbreviation,
        image: school.image,
      });
    }
  }

  const cards: VoterBallotCardData[] = [];

  for (const [userId, entry] of Object.entries(votesByVoter)) {
    const user = entry.userData;
    if (!user) continue;

    const votes = [...entry.votes].sort((a, b) => a.rank - b.rank);
    if (votes.length === 0) continue;

    const voterRankByTeam = new Map(votes.map((v) => [v.teamId, v.rank]));

    const picks: BallotPickRow[] = [];
    let gapSum = 0;
    let gapCount = 0;
    let outlierCount = 0;
    let consensusTop25Count = 0;

    for (const vote of votes) {
      const meta = teamMeta.get(vote.teamId);
      if (!meta) continue;

      const consensus = consensusById.get(vote.teamId);
      const consensusRank =
        consensus != null ? consensus.rank : null;
      const publishedRank = publishedRankById.get(vote.teamId) ?? null;
      const isOutlier = isOutlierPick({
        voterRank: vote.rank,
        publishedRank,
      });
      if (isOutlier) outlierCount += 1;

      const diff = computeDiff(vote.rank, consensusRank);
      if (consensusRank != null && consensusRank <= TOP_25) {
        consensusTop25Count += 1;
        gapSum += Math.abs(vote.rank - consensusRank);
        gapCount += 1;
      }

      picks.push({
        teamId: vote.teamId,
        name: meta.name,
        shortName: meta.shortName,
        abbreviation: meta.abbreviation,
        image: meta.image,
        voterRank: vote.rank,
        consensusRank,
        diff,
        isOutlier,
      });
    }

    const omittedTop15: OmittedConsensusTeam[] = [];
    for (const teamId of top15Ids) {
      if (voterRankByTeam.has(teamId)) continue;
      const consensus = consensusById.get(teamId);
      const meta = teamMeta.get(teamId);
      if (!consensus || !meta) continue;
      omittedTop15.push({
        teamId,
        shortName: meta.shortName,
        consensusRank: consensus.rank,
      });
      outlierCount += 1;
      gapSum += Math.abs(ABSENT_RANK - consensus.rank);
      gapCount += 1;
    }

    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    const firstPick = picks[0];

    cards.push({
      userId,
      slug: voterBallotSlug(name),
      name,
      organization: user.organization ?? "",
      organizationRole: user.organizationRole ?? "",
      matchPercent: computeBallotMatchPercent(
        picks.map((p) => p.teamId),
        consensusRanks,
      ),
      picks,
      omittedTop15,
      avgGap: gapCount > 0 ? gapSum / gapCount : 0,
      outlierCount,
      consensusTop25Count,
      numberOneShortName: firstPick?.shortName ?? "—",
    });
  }

  return cards.sort((a, b) => b.outlierCount - a.outlierCount || b.avgGap - a.avgGap);
}
