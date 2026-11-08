import {
  fetchEspnGroupConferences,
  fetchEspnGroupMembers,
} from "@redshirt-sports/clients/scores";
import { and, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";

import { primaryDb as db } from "../../client";
import {
  conferencesTable,
  divisionSportsTable,
  divisionsTable,
  ratingPoolMembersTable,
  ratingPoolsTable,
  ratingRunsTable,
  ratingSnapshotsTable,
  schoolConferenceAffiliationsTable,
  schoolExternalIdsTable,
  seasonsTable,
} from "../../schema";
import { createConferenceMatcher } from "./conference-matching";
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

/** Every conference, plus today's affiliations in a sport (used only to break ties). */
export async function loadConferenceMatching(sportId: string): Promise<{
  match: ReturnType<typeof createConferenceMatcher>;
  sportConferenceIds: Set<string>;
  currentBySchool: Map<string, Set<string>>;
}> {
  const [conferences, affiliations] = await Promise.all([
    db
      .select({
        id: conferencesTable.id,
        name: conferencesTable.name,
        shortName: conferencesTable.shortName,
        abbreviation: conferencesTable.abbreviation,
      })
      .from(conferencesTable),
    db
      .select({
        schoolId: schoolConferenceAffiliationsTable.schoolId,
        conferenceId: schoolConferenceAffiliationsTable.conferenceId,
      })
      .from(schoolConferenceAffiliationsTable)
      .where(eq(schoolConferenceAffiliationsTable.sportId, sportId)),
  ]);
  const currentBySchool = new Map<string, Set<string>>();
  for (const row of affiliations) {
    const ids = currentBySchool.get(row.schoolId) ?? new Set<string>();
    ids.add(row.conferenceId);
    currentBySchool.set(row.schoolId, ids);
  }
  return {
    match: createConferenceMatcher(conferences),
    sportConferenceIds: new Set(affiliations.map((row) => row.conferenceId)),
    currentBySchool,
  };
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
  // Link the conference the school played in that season, found by its provider label.
  const { match, sportConferenceIds, currentBySchool } =
    await loadConferenceMatching(pool.sportId);
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
          conferenceId: match(conferenceNames.get(schoolId), {
            seasonYear: calendar.year,
            sportConferenceIds,
            currentConferenceIds: currentBySchool.get(schoolId),
          }),
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

export type ConferenceRelink = {
  seasonId: string;
  seasonYear: number;
  schoolId: string;
  conferenceName: string;
  /** Rows with this season, school, and label still missing a conference. */
  rows: number;
  conferenceId: string | null;
};

/**
 * Link stored members and snapshots that have a provider conference label but
 * no conference, using the same matching as a sync. Each table is matched from
 * its own label, so snapshots are fixed even when their member was relinked
 * since (or left the pool). Dry run unless `apply`. Neither table feeds a
 * run's checksum, so nothing recomputes.
 */
export async function relinkConferences(
  pool: Pick<Pool, "id" | "sportId">,
  options: { apply: boolean },
): Promise<{
  members: ConferenceRelink[];
  snapshots: ConferenceRelink[];
  membersUpdated: number;
  snapshotsUpdated: number;
}> {
  const rows = sql<number>`count(*)::int`;
  const [memberRows, snapshotRows, matching] = await Promise.all([
    db
      .select({
        seasonId: ratingPoolMembersTable.seasonId,
        seasonYear: seasonsTable.year,
        schoolId: ratingPoolMembersTable.schoolId,
        conferenceName: ratingPoolMembersTable.conferenceName,
        rows,
      })
      .from(ratingPoolMembersTable)
      .innerJoin(
        seasonsTable,
        eq(seasonsTable.id, ratingPoolMembersTable.seasonId),
      )
      .where(
        and(
          eq(ratingPoolMembersTable.poolId, pool.id),
          isNull(ratingPoolMembersTable.conferenceId),
          isNotNull(ratingPoolMembersTable.conferenceName),
        ),
      )
      .groupBy(
        ratingPoolMembersTable.seasonId,
        seasonsTable.year,
        ratingPoolMembersTable.schoolId,
        ratingPoolMembersTable.conferenceName,
      ),
    db
      .select({
        seasonId: ratingRunsTable.seasonId,
        seasonYear: seasonsTable.year,
        schoolId: ratingSnapshotsTable.schoolId,
        conferenceName: ratingSnapshotsTable.conferenceName,
        rows,
      })
      .from(ratingSnapshotsTable)
      .innerJoin(
        ratingRunsTable,
        eq(ratingRunsTable.id, ratingSnapshotsTable.runId),
      )
      .innerJoin(seasonsTable, eq(seasonsTable.id, ratingRunsTable.seasonId))
      .where(
        and(
          eq(ratingRunsTable.poolId, pool.id),
          isNull(ratingSnapshotsTable.conferenceId),
          isNotNull(ratingSnapshotsTable.conferenceName),
        ),
      )
      .groupBy(
        ratingRunsTable.seasonId,
        seasonsTable.year,
        ratingSnapshotsTable.schoolId,
        ratingSnapshotsTable.conferenceName,
      ),
    loadConferenceMatching(pool.sportId),
  ]);
  const { match, sportConferenceIds, currentBySchool } = matching;
  const resolve = (row: (typeof memberRows)[number]): ConferenceRelink => ({
    ...row,
    conferenceName: row.conferenceName ?? "",
    conferenceId: match(row.conferenceName, {
      seasonYear: row.seasonYear,
      sportConferenceIds,
      currentConferenceIds: currentBySchool.get(row.schoolId),
    }),
  });
  const members = memberRows.map(resolve);
  const snapshots = snapshotRows.map(resolve);
  if (!options.apply) {
    return { members, snapshots, membersUpdated: 0, snapshotsUpdated: 0 };
  }
  const linked = (list: ConferenceRelink[]) =>
    list.filter(
      (row): row is ConferenceRelink & { conferenceId: string } =>
        row.conferenceId != null,
    );
  const counts = await db.transaction(async (tx) => {
    let membersUpdated = 0;
    let snapshotsUpdated = 0;
    for (const row of linked(members)) {
      const updated = await tx
        .update(ratingPoolMembersTable)
        .set({ conferenceId: row.conferenceId })
        .where(
          and(
            eq(ratingPoolMembersTable.poolId, pool.id),
            eq(ratingPoolMembersTable.seasonId, row.seasonId),
            eq(ratingPoolMembersTable.schoolId, row.schoolId),
            eq(ratingPoolMembersTable.conferenceName, row.conferenceName),
            isNull(ratingPoolMembersTable.conferenceId),
          ),
        )
        .returning({ id: ratingPoolMembersTable.id });
      membersUpdated += updated.length;
    }
    for (const row of linked(snapshots)) {
      const updated = await tx
        .update(ratingSnapshotsTable)
        .set({ conferenceId: row.conferenceId })
        .where(
          and(
            eq(ratingSnapshotsTable.schoolId, row.schoolId),
            eq(ratingSnapshotsTable.conferenceName, row.conferenceName),
            isNull(ratingSnapshotsTable.conferenceId),
            inArray(
              ratingSnapshotsTable.runId,
              tx
                .select({ id: ratingRunsTable.id })
                .from(ratingRunsTable)
                .where(
                  and(
                    eq(ratingRunsTable.poolId, pool.id),
                    eq(ratingRunsTable.seasonId, row.seasonId),
                  ),
                ),
            ),
          ),
        )
        .returning({ id: ratingSnapshotsTable.id });
      snapshotsUpdated += updated.length;
    }
    return { membersUpdated, snapshotsUpdated };
  });
  return { members, snapshots, ...counts };
}
