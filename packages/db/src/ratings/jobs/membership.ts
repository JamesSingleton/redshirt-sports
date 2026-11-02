import {
  fetchEspnGroupConferences,
  fetchEspnGroupMembers,
} from "@redshirt-sports/clients/scores";
import { and, eq, inArray } from "drizzle-orm";

import { primaryDb as db } from "../../client";
import {
  conferencesTable,
  divisionSportsTable,
  divisionsTable,
  ratingPoolMembersTable,
  ratingPoolsTable,
  schoolConferenceAffiliationsTable,
  schoolExternalIdsTable,
} from "../../schema";
import type { Pool, SeasonCalendar } from "./store";

/** provider id → school id. */
export async function loadExternalIdMap(
  provider: "espn" | "ncaa",
): Promise<Map<string, string>> {
  const rows = await db
    .select({
      externalId: schoolExternalIdsTable.externalId,
      schoolId: schoolExternalIdsTable.schoolId,
    })
    .from(schoolExternalIdsTable)
    .where(eq(schoolExternalIdsTable.provider, provider));
  return new Map(rows.map((row) => [row.externalId, row.schoolId]));
}

export type MembershipResult = {
  schoolIds: string[];
  /** Each member's conference that season. */
  conferenceNames: Map<string, string>;
  /** Provider ids in the pool with no Redshirt school yet (ESPN group pools only). */
  unmappedExternalIds: string[];
};

/** Today's Redshirt conference per school in a sport, with names for matching. */
async function currentConferences(
  sportId: string,
): Promise<Map<string, { id: string; names: string[] }>> {
  const rows = await db
    .select({
      schoolId: schoolConferenceAffiliationsTable.schoolId,
      conferenceId: schoolConferenceAffiliationsTable.conferenceId,
      name: conferencesTable.name,
      shortName: conferencesTable.shortName,
      abbreviation: conferencesTable.abbreviation,
    })
    .from(schoolConferenceAffiliationsTable)
    .innerJoin(
      conferencesTable,
      eq(conferencesTable.id, schoolConferenceAffiliationsTable.conferenceId),
    )
    .where(eq(schoolConferenceAffiliationsTable.sportId, sportId));
  return new Map(
    rows.map((row) => [
      row.schoolId,
      {
        id: row.conferenceId,
        names: [row.name, row.shortName, row.abbreviation]
          .filter((name): name is string => !!name)
          .map((name) => name.toLowerCase()),
      },
    ]),
  );
}

/** Decide who is in the pool this season, without writing anything. */
export async function resolveMembership(
  pool: Pool,
  calendar: SeasonCalendar,
): Promise<MembershipResult> {
  if (pool.membership.type === "espn_group") {
    const ids = await fetchEspnGroupMembers({
      espnLeague: pool.source.espnLeague,
      groupId: pool.membership.groupId,
      seasonYear: calendar.year,
    });
    const [map, conferences] = await Promise.all([
      loadExternalIdMap("espn"),
      fetchEspnGroupConferences({
        espnLeague: pool.source.espnLeague,
        groupId: pool.membership.groupId,
        seasonYear: calendar.year,
      }),
    ]);
    const schoolIds = new Set<string>();
    const conferenceNames = new Map<string, string>();
    const unmapped: string[] = [];
    for (const id of ids) {
      const schoolId = map.get(id);
      if (!schoolId) {
        unmapped.push(id);
        continue;
      }
      schoolIds.add(schoolId);
      const conference = conferences.get(id);
      if (conference) conferenceNames.set(schoolId, conference.shortName);
    }
    return {
      schoolIds: [...schoolIds],
      conferenceNames,
      unmappedExternalIds: unmapped,
    };
  }

  // division_conferences: schools whose conference in this sport belongs to the pool's division.
  const [division] = await db
    .select({ id: divisionsTable.id, sanityId: divisionsTable.sanityId })
    .from(ratingPoolsTable)
    .innerJoin(
      divisionSportsTable,
      eq(divisionSportsTable.id, ratingPoolsTable.divisionSportId),
    )
    .innerJoin(
      divisionsTable,
      eq(divisionsTable.id, divisionSportsTable.divisionId),
    )
    .where(eq(ratingPoolsTable.id, pool.id))
    .limit(1);
  if (!division) {
    throw new Error(`Pool ${pool.slug} has no division.`);
  }
  const divisionKeys = [division.id, division.sanityId].filter(
    (key): key is string => key != null,
  );
  const rows = await db
    .select({
      schoolId: schoolConferenceAffiliationsTable.schoolId,
      name: conferencesTable.shortName,
      fullName: conferencesTable.name,
    })
    .from(schoolConferenceAffiliationsTable)
    .innerJoin(
      conferencesTable,
      eq(conferencesTable.id, schoolConferenceAffiliationsTable.conferenceId),
    )
    .where(
      and(
        eq(schoolConferenceAffiliationsTable.sportId, pool.sportId),
        inArray(conferencesTable.divisionId, divisionKeys),
      ),
    );
  return {
    schoolIds: [...new Set(rows.map((row) => row.schoolId))],
    conferenceNames: new Map(
      rows.map((row) => [row.schoolId, row.name ?? row.fullName ?? ""]),
    ),
    unmappedExternalIds: [],
  };
}

/** Replace the stored member list for this pool and season. */
export async function saveMembership(
  pool: Pool,
  calendar: SeasonCalendar,
  membership: Pick<MembershipResult, "schoolIds" | "conferenceNames">,
): Promise<void> {
  const { schoolIds, conferenceNames } = membership;
  // Link today's Redshirt conference only when it is the one the school played in that season.
  const current = await currentConferences(pool.sportId);
  await db.transaction(async (tx) => {
    await tx
      .delete(ratingPoolMembersTable)
      .where(
        and(
          eq(ratingPoolMembersTable.poolId, pool.id),
          eq(ratingPoolMembersTable.seasonId, calendar.seasonId),
        ),
      );
    if (schoolIds.length > 0) {
      await tx.insert(ratingPoolMembersTable).values(
        schoolIds.map((schoolId) => ({
          poolId: pool.id,
          seasonId: calendar.seasonId,
          schoolId,
          conferenceId: (() => {
            const today = current.get(schoolId);
            const season = conferenceNames.get(schoolId)?.toLowerCase();
            return today && season && today.names.includes(season)
              ? today.id
              : null;
          })(),
          conferenceName: conferenceNames.get(schoolId) ?? null,
        })),
      );
    }
  });
}

export async function loadMembers(
  poolId: string,
  seasonId: string,
): Promise<
  Array<{
    schoolId: string;
    conferenceId: string | null;
    conferenceName: string | null;
  }>
> {
  return db
    .select({
      schoolId: ratingPoolMembersTable.schoolId,
      conferenceId: ratingPoolMembersTable.conferenceId,
      conferenceName: ratingPoolMembersTable.conferenceName,
    })
    .from(ratingPoolMembersTable)
    .where(
      and(
        eq(ratingPoolMembersTable.poolId, poolId),
        eq(ratingPoolMembersTable.seasonId, seasonId),
      ),
    );
}
