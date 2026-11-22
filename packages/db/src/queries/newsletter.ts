import { and, eq, gte } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  pollRankingsTable,
  pollsTable,
  seasonsTable,
  seasonTypesTable,
  sportsTable,
  weeksTable,
} from "../schema";
import { seasonTypeAndNumberToLegacyWeek } from "../utils/week-mapping";

export type PublishedPollWeek = {
  pollId: string;
  pollSlug: string;
  pollName: string;
  sportSlug: string;
  sportName: string;
  weekId: string;
  year: number;
  /** The legacy week int the rankings pages and queries use. */
  week: number;
};

/**
 * Poll weeks whose rankings were written since `since`: a publish, from admin
 * or the Monday cron, rewrites every row for its poll and week. The poll-alert
 * email uses this to find what's new without hooking into either publisher.
 */
export async function listPollWeeksPublishedSince(
  since: Date,
): Promise<PublishedPollWeek[]> {
  const rows = await db
    .selectDistinct({
      pollId: pollsTable.id,
      pollSlug: pollsTable.slug,
      pollName: pollsTable.name,
      sportSlug: sportsTable.slug,
      sportName: sportsTable.name,
      weekId: weeksTable.id,
      year: seasonsTable.year,
      seasonType: seasonTypesTable.type,
      weekNumber: weeksTable.number,
    })
    .from(pollRankingsTable)
    .innerJoin(pollsTable, eq(pollsTable.id, pollRankingsTable.pollId))
    .innerJoin(sportsTable, eq(sportsTable.id, pollsTable.sportId))
    .innerJoin(weeksTable, eq(weeksTable.id, pollRankingsTable.weekId))
    .innerJoin(
      seasonTypesTable,
      eq(seasonTypesTable.id, weeksTable.seasonTypeId),
    )
    .innerJoin(seasonsTable, eq(seasonsTable.id, seasonTypesTable.seasonId))
    .where(
      and(
        gte(pollRankingsTable.createdAt, since),
        eq(pollsTable.isActive, true),
      ),
    );

  return rows.map(({ seasonType, weekNumber, ...row }) => ({
    ...row,
    week: seasonTypeAndNumberToLegacyWeek(seasonType, weekNumber),
  }));
}
