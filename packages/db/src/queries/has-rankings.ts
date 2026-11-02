import { and, eq, exists, sql } from "drizzle-orm";

import { primaryDb as db } from "../client";
import type { pollsTable, weeksTable } from "../schema";
import { pollRankingsTable } from "../schema";

/**
 * True when `pollId` has published rankings for `weekId`: one probe on the
 * (poll_id, week_id, school_id) index. Callers walk a poll's weeks and
 * keep the ones with rankings instead of joining and de-duplicating every
 * ranking row (~30 per week).
 */
export function hasRankingsFor(
  pollId: typeof pollsTable.id,
  weekId: typeof weeksTable.id,
) {
  return exists(
    db
      .select({ one: sql`1` })
      .from(pollRankingsTable)
      .where(
        and(
          eq(pollRankingsTable.pollId, pollId),
          eq(pollRankingsTable.weekId, weekId),
        ),
      ),
  );
}
