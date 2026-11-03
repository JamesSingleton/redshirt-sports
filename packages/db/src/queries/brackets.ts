import { and, asc, count, desc, eq, inArray, or, sql } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  type BracketTeamStats,
  type BracketTeamStatsSet,
  divisionWinLoss,
  type SeasonGameRow,
  teamResults,
  winLoss,
} from "../playoff-bracket/matchup";
import type { BracketFormatSpec } from "../playoff-bracket/types";
import { specHasGame, specHasSlot } from "../playoff-bracket/validate-spec";
import type {
  BracketGameState,
  BracketSlotEntry,
} from "../playoff-bracket/view";
import {
  bracketEditionsTable,
  bracketFormatsTable,
  bracketGamesTable,
  bracketSlotsTable,
  gamesTable,
  pollRankingsTable,
  pollsTable,
  ratingPoolMembersTable,
  ratingPoolsTable,
  ratingRunsTable,
  ratingSnapshotsTable,
  SEASON_TYPE_CODES,
  schoolsTable,
  seasonsTable,
  seasonTypesTable,
  sportsTable,
  weeksTable,
} from "../schema";
import { schoolLogoImage } from "./rankings";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type BracketKind = "projection" | "official";
export type BracketStatus = "draft" | "published";

export type BracketEditionSummary = {
  id: string;
  kind: BracketKind;
  status: BracketStatus;
  formatId: string;
  formatKey: string;
  sportId: string;
  sportSlug: string;
  divisionSlug: string | null;
  seasonId: string;
  year: number;
  weekId: string | null;
  weekNumber: number | null;
  articleUrl: string | null;
  publicNote: string | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
};

export type BracketEditionDetail = {
  edition: BracketEditionSummary;
  spec: BracketFormatSpec;
  slots: BracketSlotEntry[];
  games: BracketGameState[];
};

export class BracketInputError extends Error {}

const editionSummaryColumns = {
  id: bracketEditionsTable.id,
  kind: sql<BracketKind>`${bracketEditionsTable.kind}`,
  status: sql<BracketStatus>`${bracketEditionsTable.status}`,
  formatId: bracketEditionsTable.formatId,
  formatKey: bracketFormatsTable.key,
  sportId: bracketFormatsTable.sportId,
  sportSlug: sportsTable.slug,
  divisionSlug: bracketFormatsTable.divisionSlug,
  seasonId: bracketEditionsTable.seasonId,
  year: seasonsTable.year,
  weekId: bracketEditionsTable.weekId,
  weekNumber: weeksTable.number,
  articleUrl: bracketEditionsTable.articleUrl,
  publicNote: bracketEditionsTable.publicNote,
  publishedAt: bracketEditionsTable.publishedAt,
  updatedAt: bracketEditionsTable.updatedAt,
};

function editionSummaries() {
  return db
    .select(editionSummaryColumns)
    .from(bracketEditionsTable)
    .innerJoin(
      bracketFormatsTable,
      eq(bracketEditionsTable.formatId, bracketFormatsTable.id),
    )
    .innerJoin(sportsTable, eq(bracketFormatsTable.sportId, sportsTable.id))
    .innerJoin(seasonsTable, eq(bracketEditionsTable.seasonId, seasonsTable.id))
    .leftJoin(weeksTable, eq(bracketEditionsTable.weekId, weeksTable.id))
    .$dynamic();
}

/** The format in force for a sport, division and season year. */
export async function findBracketFormat({
  sportSlug,
  divisionSlug,
  year,
}: {
  sportSlug: string;
  divisionSlug: string | null;
  year: number;
}) {
  const rows = await db
    .select({
      id: bracketFormatsTable.id,
      key: bracketFormatsTable.key,
      sportId: bracketFormatsTable.sportId,
      spec: sql<BracketFormatSpec>`${bracketFormatsTable.spec}`,
    })
    .from(bracketFormatsTable)
    .innerJoin(sportsTable, eq(bracketFormatsTable.sportId, sportsTable.id))
    .where(
      and(
        eq(sportsTable.slug, sportSlug),
        divisionSlug === null
          ? sql`${bracketFormatsTable.divisionSlug} is null`
          : eq(bracketFormatsTable.divisionSlug, divisionSlug),
        sql`${bracketFormatsTable.effectiveFromYear} <= ${year}`,
        sql`(${bracketFormatsTable.effectiveToYear} is null or ${bracketFormatsTable.effectiveToYear} >= ${year})`,
      ),
    )
    .limit(2);

  if (rows.length > 1) {
    throw new Error(
      `Two bracket formats match ${sportSlug}/${divisionSlug ?? "none"}/${year}`,
    );
  }
  return rows[0] ?? null;
}

export async function getBracketEditionSummary(editionId: string) {
  const [edition] = await editionSummaries()
    .where(eq(bracketEditionsTable.id, editionId))
    .limit(1);
  return edition ?? null;
}

/** An edition with its spec, filled slots and game state, in one round trip. */
export async function getBracketEdition(
  editionId: string,
): Promise<BracketEditionDetail | null> {
  const [edition] = await editionSummaries()
    .where(eq(bracketEditionsTable.id, editionId))
    .limit(1);
  if (!edition) return null;

  const [format, slots, games] = await Promise.all([
    db
      .select({ spec: sql<BracketFormatSpec>`${bracketFormatsTable.spec}` })
      .from(bracketFormatsTable)
      .where(eq(bracketFormatsTable.id, edition.formatId))
      .limit(1),
    db
      .select({
        slotKey: bracketSlotsTable.slotKey,
        bidType: bracketSlotsTable.bidType,
        bidLabel: bracketSlotsTable.bidLabel,
        schoolId: schoolsTable.id,
        name: schoolsTable.name,
        shortName: schoolsTable.shortName,
        abbreviation: schoolsTable.abbreviation,
        slug: schoolsTable.slug,
        image: schoolLogoImage,
      })
      .from(bracketSlotsTable)
      .innerJoin(schoolsTable, eq(bracketSlotsTable.schoolId, schoolsTable.id))
      .where(eq(bracketSlotsTable.editionId, editionId)),
    db
      .select({
        gameKey: bracketGamesTable.gameKey,
        homeSide: bracketGamesTable.homeSide,
        siteLabel: bracketGamesTable.siteLabel,
        kickoffAt: bracketGamesTable.kickoffAt,
        status: bracketGamesTable.status,
        sideAScore: bracketGamesTable.sideAScore,
        sideBScore: bracketGamesTable.sideBScore,
        winnerSide: bracketGamesTable.winnerSide,
      })
      .from(bracketGamesTable)
      .where(eq(bracketGamesTable.editionId, editionId)),
  ]);

  const spec = format[0]?.spec;
  if (!spec) return null;

  return {
    edition,
    spec,
    slots: slots.map(({ slotKey, bidType, bidLabel, ...team }) => ({
      slotKey,
      bidType,
      bidLabel,
      team,
    })),
    games,
  };
}

/**
 * Published editions for a season: the official bracket (if published) and
 * every published projection, newest week first.
 */
export async function getPublishedBracketEditions({
  sportSlug,
  divisionSlug,
  year,
}: {
  sportSlug: string;
  divisionSlug: string;
  year: number;
}) {
  const rows = await editionSummaries()
    .where(
      and(
        eq(sportsTable.slug, sportSlug),
        eq(bracketFormatsTable.divisionSlug, divisionSlug),
        eq(seasonsTable.year, year),
        eq(bracketEditionsTable.status, "published"),
      ),
    )
    .orderBy(desc(weeksTable.number));

  return {
    official: rows.find((row) => row.kind === "official") ?? null,
    projections: rows.filter((row) => row.kind === "projection"),
  };
}

/** Seasons with at least one published edition, newest first. */
export async function listPublishedBracketSeasons({
  sportSlug,
  divisionSlug,
}: {
  sportSlug: string;
  divisionSlug: string;
}) {
  const rows = await db
    .selectDistinct({ year: seasonsTable.year })
    .from(bracketEditionsTable)
    .innerJoin(
      bracketFormatsTable,
      eq(bracketEditionsTable.formatId, bracketFormatsTable.id),
    )
    .innerJoin(sportsTable, eq(bracketFormatsTable.sportId, sportsTable.id))
    .innerJoin(seasonsTable, eq(bracketEditionsTable.seasonId, seasonsTable.id))
    .where(
      and(
        eq(sportsTable.slug, sportSlug),
        eq(bracketFormatsTable.divisionSlug, divisionSlug),
        eq(bracketEditionsTable.status, "published"),
      ),
    )
    .orderBy(desc(seasonsTable.year));
  return rows.map((row) => row.year);
}

/** Every edition, newest season and week first, for the admin list. */
export async function listBracketEditions() {
  return editionSummaries().orderBy(
    desc(seasonsTable.year),
    asc(bracketFormatsTable.key),
    desc(bracketEditionsTable.kind),
    desc(weeksTable.number),
  );
}

/** Football formats editors can open a bracket for this year. */
export async function listCurrentBracketFormats(year: number) {
  return db
    .select({
      id: bracketFormatsTable.id,
      key: bracketFormatsTable.key,
      sportId: bracketFormatsTable.sportId,
      sportSlug: sportsTable.slug,
      divisionSlug: bracketFormatsTable.divisionSlug,
    })
    .from(bracketFormatsTable)
    .innerJoin(sportsTable, eq(bracketFormatsTable.sportId, sportsTable.id))
    .where(
      and(
        sql`${bracketFormatsTable.effectiveFromYear} <= ${year}`,
        sql`(${bracketFormatsTable.effectiveToYear} is null or ${bracketFormatsTable.effectiveToYear} >= ${year})`,
      ),
    )
    .orderBy(asc(sportsTable.slug), asc(bracketFormatsTable.divisionSlug));
}

/** Regular-season weeks a projection can be dated to. */
export async function listProjectionWeeks(seasonId: string) {
  return db
    .select({ id: weeksTable.id, number: weeksTable.number })
    .from(weeksTable)
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .where(
      and(
        eq(seasonTypesTable.seasonId, seasonId),
        eq(seasonTypesTable.type, SEASON_TYPE_CODES.REGULAR_SEASON),
      ),
    )
    .orderBy(asc(weeksTable.number));
}

export async function getSeasonForSport(sportId: string, year: number) {
  const [row] = await db
    .select({ id: seasonsTable.id, year: seasonsTable.year })
    .from(seasonsTable)
    .where(and(eq(seasonsTable.sportId, sportId), eq(seasonsTable.year, year)))
    .limit(1);
  return row ?? null;
}

/**
 * Schools an editor can place: the division's rating-pool members that season
 * (pool slugs match division slugs), else every school with a name.
 */
export async function listBracketSchoolOptions({
  seasonId,
  sportId,
  divisionSlug,
}: {
  seasonId: string;
  sportId: string;
  divisionSlug: string | null;
}) {
  if (divisionSlug) {
    const members = await db
      .select({
        id: schoolsTable.id,
        name: schoolsTable.name,
        shortName: schoolsTable.shortName,
        conference: ratingPoolMembersTable.conferenceName,
      })
      .from(ratingPoolMembersTable)
      .innerJoin(
        ratingPoolsTable,
        eq(ratingPoolMembersTable.poolId, ratingPoolsTable.id),
      )
      .innerJoin(
        schoolsTable,
        eq(ratingPoolMembersTable.schoolId, schoolsTable.id),
      )
      .where(
        and(
          eq(ratingPoolsTable.sportId, sportId),
          eq(ratingPoolsTable.slug, divisionSlug),
          eq(ratingPoolMembersTable.seasonId, seasonId),
        ),
      )
      .orderBy(asc(schoolsTable.shortName));
    if (members.length > 0) return members;
  }

  return db
    .select({
      id: schoolsTable.id,
      name: schoolsTable.name,
      shortName: schoolsTable.shortName,
      conference: sql<string | null>`null`,
    })
    .from(schoolsTable)
    .where(sql`${schoolsTable.name} is not null`)
    .orderBy(asc(schoolsTable.shortName));
}

/**
 * Opens a projection for a week or the season's official bracket. Copies the
 * filled slots of `copySlotsFrom` so a new week starts from last week's field.
 */
export async function createBracketEdition({
  formatId,
  seasonId,
  kind,
  weekId,
  copySlotsFrom,
}: {
  formatId: string;
  seasonId: string;
  kind: BracketKind;
  weekId: string | null;
  copySlotsFrom?: string | null;
}) {
  if ((kind === "projection") !== (weekId !== null)) {
    throw new BracketInputError(
      kind === "projection"
        ? "A projection needs a week"
        : "The official bracket has no week",
    );
  }

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(bracketEditionsTable)
      .values({ formatId, seasonId, kind, weekId, status: "draft" })
      .onConflictDoNothing()
      .returning({ id: bracketEditionsTable.id });
    if (!created) {
      throw new BracketInputError(
        kind === "projection"
          ? "That week already has a projection"
          : "This season already has an official bracket",
      );
    }

    if (copySlotsFrom) {
      const [source] = await tx
        .select({ formatId: bracketEditionsTable.formatId })
        .from(bracketEditionsTable)
        .where(eq(bracketEditionsTable.id, copySlotsFrom))
        .limit(1);
      if (source?.formatId !== formatId) {
        throw new BracketInputError("Copy from an edition of the same format");
      }
      await tx.execute(sql`
        insert into ${bracketSlotsTable} (id, edition_id, slot_key, school_id, bid_type, bid_label)
        select gen_random_uuid()::text, ${created.id}, slot_key, school_id, bid_type, bid_label
        from ${bracketSlotsTable}
        where edition_id = ${copySlotsFrom}
      `);
    }

    return created.id;
  });
}

async function lockEdition(tx: DbTransaction, editionId: string) {
  const [row] = await tx
    .select({
      id: bracketEditionsTable.id,
      spec: sql<BracketFormatSpec>`${bracketFormatsTable.spec}`,
    })
    .from(bracketEditionsTable)
    .innerJoin(
      bracketFormatsTable,
      eq(bracketEditionsTable.formatId, bracketFormatsTable.id),
    )
    .where(eq(bracketEditionsTable.id, editionId))
    .for("update", { of: bracketEditionsTable })
    .limit(1);
  if (!row) throw new BracketInputError("Bracket not found");
  return row.spec;
}

async function touchEdition(tx: DbTransaction, editionId: string) {
  await tx
    .update(bracketEditionsTable)
    .set({ updatedAt: sql`now()` })
    .where(eq(bracketEditionsTable.id, editionId));
}

/**
 * Puts a school in a slot, or empties the slot when `schoolId` is null. A
 * school already placed elsewhere in the edition trades places with the
 * slot's current school. Returns the other slot when a swap happened.
 */
export async function setBracketSlot({
  editionId,
  slotKey,
  schoolId,
  bidType,
  bidLabel,
}: {
  editionId: string;
  slotKey: string;
  schoolId: string | null;
  bidType: "auto" | "at-large" | null;
  bidLabel: string | null;
}): Promise<{ swappedWith: string | null }> {
  return db.transaction(async (tx) => {
    const spec = await lockEdition(tx, editionId);
    if (!specHasSlot(spec, slotKey)) {
      throw new BracketInputError(`Unknown slot ${slotKey}`);
    }

    const rows = await tx
      .select()
      .from(bracketSlotsTable)
      .where(eq(bracketSlotsTable.editionId, editionId));
    const current = rows.find((row) => row.slotKey === slotKey) ?? null;
    const elsewhere =
      schoolId === null
        ? null
        : (rows.find(
            (row) => row.schoolId === schoolId && row.slotKey !== slotKey,
          ) ?? null);

    // Delete before insert so the per-edition school uniqueness never trips.
    for (const row of [current, elsewhere]) {
      if (row) {
        await tx
          .delete(bracketSlotsTable)
          .where(eq(bracketSlotsTable.id, row.id));
      }
    }
    if (elsewhere && current) {
      await tx.insert(bracketSlotsTable).values({
        editionId,
        slotKey: elsewhere.slotKey,
        schoolId: current.schoolId,
        bidType: current.bidType,
        bidLabel: current.bidLabel,
      });
    }
    if (schoolId) {
      await tx
        .insert(bracketSlotsTable)
        .values({ editionId, slotKey, schoolId, bidType, bidLabel });
    }

    await touchEdition(tx, editionId);
    return { swappedWith: elsewhere?.slotKey ?? null };
  });
}

/**
 * Saves a game's state. Two different scores make it final with the higher
 * score winning; an empty game removes its row.
 */
export async function setBracketGame({
  editionId,
  gameKey,
  homeSide,
  siteLabel,
  kickoffAt,
  sideAScore,
  sideBScore,
}: {
  editionId: string;
  gameKey: string;
  homeSide: "a" | "b" | null;
  siteLabel: string | null;
  kickoffAt: Date | null;
  sideAScore: number | null;
  sideBScore: number | null;
}) {
  const scored = sideAScore !== null && sideBScore !== null;
  if (scored && sideAScore === sideBScore) {
    throw new BracketInputError("A playoff game cannot end in a tie");
  }
  if ((sideAScore === null) !== (sideBScore === null)) {
    throw new BracketInputError("Enter both scores or neither");
  }
  const winnerSide = scored ? (sideAScore > sideBScore ? "a" : "b") : null;
  const empty = !homeSide && !siteLabel && !kickoffAt && !scored;

  await db.transaction(async (tx) => {
    const spec = await lockEdition(tx, editionId);
    if (!specHasGame(spec, gameKey)) {
      throw new BracketInputError(`Unknown game ${gameKey}`);
    }

    if (empty) {
      await tx
        .delete(bracketGamesTable)
        .where(
          and(
            eq(bracketGamesTable.editionId, editionId),
            eq(bracketGamesTable.gameKey, gameKey),
          ),
        );
    } else {
      const values = {
        homeSide,
        siteLabel,
        kickoffAt,
        sideAScore,
        sideBScore,
        winnerSide,
        status: winnerSide ? "final" : "scheduled",
      };
      await tx
        .insert(bracketGamesTable)
        .values({ editionId, gameKey, ...values })
        .onConflictDoUpdate({
          target: [bracketGamesTable.editionId, bracketGamesTable.gameKey],
          set: { ...values, updatedAt: sql`now()` },
        });
    }

    await touchEdition(tx, editionId);
  });
}

export async function updateBracketEditionDetails({
  editionId,
  articleUrl,
  publicNote,
}: {
  editionId: string;
  articleUrl: string | null;
  publicNote: string | null;
}) {
  if (articleUrl && !/^https?:\/\//.test(articleUrl)) {
    throw new BracketInputError("The article link must start with http(s)://");
  }
  await db
    .update(bracketEditionsTable)
    .set({ articleUrl, publicNote, updatedAt: sql`now()` })
    .where(eq(bracketEditionsTable.id, editionId));
}

/** Publishing keeps the first publish time; unpublishing clears it. */
export async function setBracketEditionStatus({
  editionId,
  status,
  userId,
}: {
  editionId: string;
  status: BracketStatus;
  userId: string | null;
}) {
  await db
    .update(bracketEditionsTable)
    .set(
      status === "published"
        ? {
            status,
            publishedAt: sql`coalesce(${bracketEditionsTable.publishedAt}, now())`,
            publishedByUserId: userId,
            updatedAt: sql`now()`,
          }
        : {
            status,
            publishedAt: null,
            publishedByUserId: null,
            updatedAt: sql`now()`,
          },
    )
    .where(eq(bracketEditionsTable.id, editionId));
}

/** Drafts only: a published edition may be embedded in an article. */
export async function deleteDraftBracketEdition(editionId: string) {
  const deleted = await db
    .delete(bracketEditionsTable)
    .where(
      and(
        eq(bracketEditionsTable.id, editionId),
        eq(bracketEditionsTable.status, "draft"),
      ),
    )
    .returning({ id: bracketEditionsTable.id });
  if (deleted.length === 0) {
    throw new BracketInputError("Only an unpublished bracket can be deleted");
  }
}

/**
 * Weeks a projection may draw on: the preseason and regular season up to its
 * week. The official bracket uses everything.
 */
function throughWeek(weekNumber: number | null) {
  return weekNumber === null
    ? undefined
    : sql`(${seasonTypesTable.type} < ${SEASON_TYPE_CODES.REGULAR_SEASON} or (${seasonTypesTable.type} = ${SEASON_TYPE_CODES.REGULAR_SEASON} and ${weeksTable.number} <= ${weekNumber}))`;
}

/**
 * Matchup-panel numbers for every school in an edition: the poll and computer
 * ratings published for the edition's week (or latest, for the official
 * bracket) and each school's final games through that week.
 */
export async function getBracketTeamStats(
  editionId: string,
): Promise<BracketTeamStatsSet | null> {
  const edition = await getBracketEditionSummary(editionId);
  if (!edition) return null;
  const empty: BracketTeamStatsSet = {
    asOf: { pollWeek: null, ratingsWeek: null, ratingsPoolSize: null },
    teams: {},
  };
  const slots = await db
    .select({ schoolId: bracketSlotsTable.schoolId })
    .from(bracketSlotsTable)
    .where(eq(bracketSlotsTable.editionId, editionId));
  const schoolIds = slots.map((slot) => slot.schoolId);
  if (schoolIds.length === 0 || !edition.divisionSlug) return empty;

  const weekFilter = throughWeek(
    edition.kind === "projection" ? edition.weekNumber : null,
  );

  const [pollWeek, ratingsRun, games] = await Promise.all([
    db
      .select({
        pollId: pollRankingsTable.pollId,
        weekId: pollRankingsTable.weekId,
        number: weeksTable.number,
      })
      .from(pollRankingsTable)
      .innerJoin(pollsTable, eq(pollRankingsTable.pollId, pollsTable.id))
      .innerJoin(weeksTable, eq(pollRankingsTable.weekId, weeksTable.id))
      .innerJoin(
        seasonTypesTable,
        eq(weeksTable.seasonTypeId, seasonTypesTable.id),
      )
      .where(
        and(
          eq(pollsTable.sportId, edition.sportId),
          eq(pollsTable.slug, edition.divisionSlug),
          eq(seasonTypesTable.seasonId, edition.seasonId),
          weekFilter,
        ),
      )
      .orderBy(desc(seasonTypesTable.type), desc(weeksTable.number))
      .limit(1),
    db
      .select({ id: ratingRunsTable.id, number: weeksTable.number })
      .from(ratingRunsTable)
      .innerJoin(
        ratingPoolsTable,
        eq(ratingRunsTable.poolId, ratingPoolsTable.id),
      )
      .innerJoin(weeksTable, eq(ratingRunsTable.weekId, weeksTable.id))
      .innerJoin(
        seasonTypesTable,
        eq(weeksTable.seasonTypeId, seasonTypesTable.id),
      )
      .where(
        and(
          eq(ratingPoolsTable.sportId, edition.sportId),
          eq(ratingPoolsTable.slug, edition.divisionSlug),
          eq(ratingRunsTable.seasonId, edition.seasonId),
          eq(ratingRunsTable.status, "published"),
          weekFilter,
        ),
      )
      .orderBy(desc(ratingRunsTable.throughAt))
      .limit(1),
    db
      .select({
        id: gamesTable.id,
        kickoffAt: gamesTable.kickoffAt,
        homeSchoolId: gamesTable.homeSchoolId,
        awaySchoolId: gamesTable.awaySchoolId,
        homeName: gamesTable.homeName,
        awayName: gamesTable.awayName,
        homeShortName: gamesTable.homeShortName,
        awayShortName: gamesTable.awayShortName,
        homeLevel: gamesTable.homeLevel,
        awayLevel: gamesTable.awayLevel,
        homeScore: gamesTable.homeScore,
        awayScore: gamesTable.awayScore,
        neutralSite: gamesTable.neutralSite,
        overtime: gamesTable.overtime,
      })
      .from(gamesTable)
      .leftJoin(weeksTable, eq(gamesTable.weekId, weeksTable.id))
      .leftJoin(
        seasonTypesTable,
        eq(weeksTable.seasonTypeId, seasonTypesTable.id),
      )
      .where(
        and(
          eq(gamesTable.seasonId, edition.seasonId),
          eq(gamesTable.status, "final"),
          or(
            inArray(gamesTable.homeSchoolId, schoolIds),
            inArray(gamesTable.awaySchoolId, schoolIds),
          ),
          weekFilter,
        ),
      ),
  ]);

  const poll = pollWeek[0];
  const run = ratingsRun[0];
  const [pollRows, ratingRows, poolSize] = await Promise.all([
    poll
      ? db
          .select({
            schoolId: pollRankingsTable.schoolId,
            rank: pollRankingsTable.rank,
            points: pollRankingsTable.points,
            firstPlaceVotes: pollRankingsTable.firstPlaceVotes,
            isTie: pollRankingsTable.isTie,
          })
          .from(pollRankingsTable)
          .where(
            and(
              eq(pollRankingsTable.pollId, poll.pollId),
              eq(pollRankingsTable.weekId, poll.weekId),
              inArray(pollRankingsTable.schoolId, schoolIds),
            ),
          )
      : [],
    run
      ? db
          .select({
            schoolId: ratingSnapshotsTable.schoolId,
            powerRank: ratingSnapshotsTable.powerRank,
            sorRank: ratingSnapshotsTable.sorRank,
            sosRank: ratingSnapshotsTable.sosRank,
          })
          .from(ratingSnapshotsTable)
          .where(
            and(
              eq(ratingSnapshotsTable.runId, run.id),
              inArray(ratingSnapshotsTable.schoolId, schoolIds),
            ),
          )
      : [],
    run
      ? db
          .select({ total: count() })
          .from(ratingSnapshotsTable)
          .where(eq(ratingSnapshotsTable.runId, run.id))
      : [],
  ]);

  const polls = new Map(pollRows.map((row) => [row.schoolId, row]));
  const ratings = new Map(ratingRows.map((row) => [row.schoolId, row]));
  const seasonGames: SeasonGameRow[] = games;
  const teams: Record<string, BracketTeamStats> = {};
  for (const schoolId of schoolIds) {
    const results = teamResults(schoolId, seasonGames);
    const pollRow = polls.get(schoolId);
    const ratingRow = ratings.get(schoolId);
    teams[schoolId] = {
      schoolId,
      record: winLoss(results),
      divisionRecord: divisionWinLoss(results),
      poll:
        pollRow?.rank != null
          ? {
              rank: pollRow.rank,
              points: pollRow.points,
              firstPlaceVotes: pollRow.firstPlaceVotes,
              isTie: pollRow.isTie,
            }
          : null,
      ratings: ratingRow
        ? {
            powerRank: ratingRow.powerRank,
            sorRank: ratingRow.sorRank,
            sosRank: ratingRow.sosRank,
          }
        : null,
      results,
    };
  }

  return {
    asOf: {
      pollWeek: poll?.number ?? null,
      ratingsWeek: run?.number ?? null,
      ratingsPoolSize: poolSize[0]?.total ?? null,
    },
    teams,
  };
}
