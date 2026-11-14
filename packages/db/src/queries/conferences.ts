import { eq, inArray, sql } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  conferenceSportSubdivisionsTable,
  conferenceSportsTable,
  conferencesTable,
  divisionsTable,
  sportsTable,
} from "../schema";
import type { DbExecutor } from "./players";
import { subdivisionIdsBySanityId } from "./schools";

/** One row of a Sanity conference's `sportSubdivisionAffiliations`, by Sanity ids. */
export type SanitySportSubdivision = {
  sportId?: string | null;
  /** A `sportSubgrouping` document id. */
  subdivisionId?: string | null;
};

/**
 * Makes a conference's per-sport subdivisions in Postgres match Sanity:
 * Big Sky football → FCS, Big Sky basketball → Mid-Major. Rows naming a
 * sport or subdivision Postgres doesn't have are skipped and returned.
 */
export async function replaceConferenceSportSubdivisions(
  executor: DbExecutor,
  conferenceId: string,
  subdivisions: SanitySportSubdivision[],
) {
  const wanted = subdivisions.filter(
    (row): row is { sportId: string; subdivisionId: string } =>
      Boolean(row.sportId && row.subdivisionId),
  );
  const subdivisionBySanityId = await subdivisionIdsBySanityId(
    executor,
    wanted.map((row) => row.subdivisionId),
  );
  const sportIds = [...new Set(wanted.map((row) => row.sportId))];
  const knownSports = new Set(
    sportIds.length
      ? (
          await executor
            .select({ id: sportsTable.id })
            .from(sportsTable)
            .where(inArray(sportsTable.id, sportIds))
        ).map((row) => row.id)
      : [],
  );

  const rows: Array<{
    conferenceId: string;
    sportId: string;
    subdivisionId: string;
  }> = [];
  const skipped: SanitySportSubdivision[] = [];
  const seenSports = new Set<string>();
  for (const row of wanted) {
    const subdivisionId = subdivisionBySanityId.get(row.subdivisionId);
    if (!subdivisionId || !knownSports.has(row.sportId)) {
      skipped.push(row);
      continue;
    }
    // One subdivision per conference and sport; Sanity's first row wins.
    if (seenSports.has(row.sportId)) continue;
    seenSports.add(row.sportId);
    rows.push({ conferenceId, sportId: row.sportId, subdivisionId });
  }

  await executor
    .delete(conferenceSportSubdivisionsTable)
    .where(eq(conferenceSportSubdivisionsTable.conferenceId, conferenceId));
  if (rows.length > 0) {
    await executor.insert(conferenceSportSubdivisionsTable).values(rows);
  }
  return { replaced: rows.length, skipped };
}

/** A Sanity conference, as the sync function sends it. */
export type SanityConferenceSyncPayload = {
  sanityId: string;
  name?: string | null;
  shortName?: string | null;
  abbreviation?: string | null;
  slug?: string | null;
  /** `primaryClassification`: the level's `classification` document id. */
  divisionSanityId?: string | null;
  /** Sport ids the conference sponsors (`sports`). */
  sportIds?: string[] | null;
  subdivisions?: SanitySportSubdivision[] | null;
};

/**
 * Creates or updates a conference from Sanity, the source of truth, with
 * its sports and per-sport subdivisions, in one transaction. The logo is
 * left alone: it only comes from the admin conference loader.
 */
export async function upsertConferenceFromSanity(
  payload: SanityConferenceSyncPayload,
) {
  return db.transaction(async (tx) => {
    const [division] = payload.divisionSanityId
      ? await tx
          .select({ id: divisionsTable.id })
          .from(divisionsTable)
          .where(eq(divisionsTable.sanityId, payload.divisionSanityId))
          .limit(1)
      : [];

    const values = {
      name: payload.name ?? null,
      shortName: payload.shortName ?? null,
      abbreviation: payload.abbreviation ?? null,
      slug: payload.slug ?? null,
      updatedAt: new Date(),
      // Keep the current level when Sanity names one Postgres doesn't have.
      ...(division && { divisionId: division.id }),
    };
    const [row] = await tx
      .insert(conferencesTable)
      .values({ sanityId: payload.sanityId, ...values })
      .onConflictDoUpdate({ target: conferencesTable.sanityId, set: values })
      .returning({
        id: conferencesTable.id,
        inserted: sql<boolean>`xmax = 0`,
      });
    if (!row) throw new Error("Conference upsert did not return a row");

    let sports: number | null = null;
    if (payload.sportIds) {
      const known = payload.sportIds.length
        ? await tx
            .select({ id: sportsTable.id })
            .from(sportsTable)
            .where(inArray(sportsTable.id, payload.sportIds))
        : [];
      await tx
        .delete(conferenceSportsTable)
        .where(eq(conferenceSportsTable.conferenceId, row.id));
      if (known.length > 0) {
        await tx
          .insert(conferenceSportsTable)
          .values(
            known.map(({ id }) => ({ conferenceId: row.id, sportId: id })),
          );
      }
      sports = known.length;
    }

    const subdivisions = payload.subdivisions
      ? await replaceConferenceSportSubdivisions(
          tx,
          row.id,
          payload.subdivisions,
        )
      : null;

    const inserted = row.inserted === true || `${row.inserted}` === "t";
    return {
      action: inserted ? ("inserted" as const) : ("updated" as const),
      id: row.id,
      divisionFound: Boolean(division),
      sports,
      subdivisions,
    };
  });
}
