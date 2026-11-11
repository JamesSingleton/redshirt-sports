import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";

import { primaryDb as db } from "../client";
import { gamesTable, seasonsTable, sportsTable } from "../schema";
import { likeContains } from "../utils/search-query";

/** A game as the Studio's game picker shows it. */
export type GamePickerResult = {
  provider: "espn" | "ncaa";
  id: string;
  sport: string;
  homeName: string;
  awayName: string;
  neutralSite: boolean;
  kickoffAt: string | null;
};

/**
 * Games whose team names contain `term`, newest first, for picking the game
 * an article covers. Looks back about two seasons and a few weeks ahead,
 * which covers recaps of last season and previews of upcoming games.
 */
export async function searchGamesForPicker({
  term,
  now = new Date(),
  limit = 20,
}: {
  term: string;
  now?: Date;
  limit?: number;
}): Promise<GamePickerResult[]> {
  const pattern = likeContains(term.trim());
  const from = new Date(now.getTime() - 540 * 24 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      source: gamesTable.source,
      sourceGameId: gamesTable.sourceGameId,
      sport: sportsTable.slug,
      homeName: gamesTable.homeName,
      awayName: gamesTable.awayName,
      neutralSite: gamesTable.neutralSite,
      kickoffAt: gamesTable.kickoffAt,
    })
    .from(gamesTable)
    .innerJoin(seasonsTable, eq(gamesTable.seasonId, seasonsTable.id))
    .innerJoin(sportsTable, eq(seasonsTable.sportId, sportsTable.id))
    .where(
      and(
        gte(gamesTable.kickoffAt, from),
        lte(gamesTable.kickoffAt, to),
        or(
          ilike(gamesTable.homeName, pattern),
          ilike(gamesTable.awayName, pattern),
          ilike(gamesTable.homeShortName, pattern),
          ilike(gamesTable.awayShortName, pattern),
        ),
      ),
    )
    .orderBy(desc(gamesTable.kickoffAt))
    .limit(limit);

  return rows.flatMap((row) =>
    row.source === "espn" || row.source === "ncaa"
      ? [
          {
            provider: row.source,
            id: row.sourceGameId,
            sport: row.sport,
            homeName: row.homeName,
            awayName: row.awayName,
            neutralSite: row.neutralSite,
            kickoffAt: row.kickoffAt?.toISOString() ?? null,
          },
        ]
      : [],
  );
}
