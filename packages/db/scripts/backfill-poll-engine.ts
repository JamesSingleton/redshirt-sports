/**
 * One-time migration from legacy ballot/rankings storage into the poll engine.
 *
 * Flags: --dry-run | --verify-only
 * Requires DATABASE_URL. Prefer a local clone before production.
 */

import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";

import { primaryDb as db } from "../src/client";
import {
  ballotEntriesTable,
  ballotsTable,
  divisionSportsTable,
  divisionsTable,
  pollRankingsTable,
  pollsTable,
  pollVotersTable,
  schoolsTable,
  seasonsTable,
  seasonTypesTable,
  sportsTable,
  usersTable,
  weeksTable,
} from "../src/schema";
import { legacyWeekToSeasonTypeAndNumber } from "../src/utils/week-mapping";

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const VERIFY_ONLY = args.has("--verify-only");

function asRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}

type PollSeed = {
  sportSlug: string;
  slug: string;
  name: string;
};

const POLL_SEEDS: PollSeed[] = [
  { sportSlug: "football", slug: "fbs", name: "FBS Top 25" },
  { sportSlug: "football", slug: "fcs", name: "FCS Top 25" },
  { sportSlug: "football", slug: "d2", name: "Division II Top 25" },
  { sportSlug: "football", slug: "d3", name: "Division III Top 25" },
  {
    sportSlug: "mens-basketball",
    slug: "power-conferences",
    name: "Men's Basketball Power Conferences Top 25",
  },
  {
    sportSlug: "mens-basketball",
    slug: "mid-major",
    name: "Men's Basketball Mid-Major Top 25",
  },
  {
    sportSlug: "mens-basketball",
    slug: "d2",
    name: "Men's Basketball Division II Top 25",
  },
  {
    sportSlug: "mens-basketball",
    slug: "d3",
    name: "Men's Basketball Division III Top 25",
  },
  {
    sportSlug: "womens-basketball",
    slug: "power-conferences",
    name: "Women's Basketball Power Conferences Top 25",
  },
  {
    sportSlug: "womens-basketball",
    slug: "mid-major",
    name: "Women's Basketball Mid-Major Top 25",
  },
  {
    sportSlug: "womens-basketball",
    slug: "d2",
    name: "Women's Basketball Division II Top 25",
  },
  {
    sportSlug: "womens-basketball",
    slug: "d3",
    name: "Women's Basketball Division III Top 25",
  },
];

type LegacyBallotRow = {
  userId: string;
  division: string;
  week: number;
  year: number;
  createdAt: Date;
  teamId: string;
  rank: number;
  points: number;
  sportId: string | null;
};

type LegacyRankingRow = {
  id: number;
  division: string;
  sportId: string | null;
  week: number;
  year: number;
  rankings: unknown;
};

type RankingTeam = {
  _id?: string;
  id?: string;
  rank?: number | null;
  firstPlaceVotes?: number;
  isTie?: boolean;
  _points?: number;
  points?: number;
};

const stats = {
  pollsCreated: 0,
  pollsSkipped: 0,
  pollVotersCreated: 0,
  pollVotersSkipped: 0,
  ballotsCreated: 0,
  ballotsSkipped: 0,
  ballotEntriesCreated: 0,
  rankingsWeeksCreated: 0,
  rankingsWeeksSkipped: 0,
  rankingRowsCreated: 0,
  unmappedSchools: new Set<string>(),
  unmappedWeeks: new Set<string>(),
  unmappedPolls: new Set<string>(),
  neverVotedVoters: [] as string[],
};

async function resolveWeekId({
  sportId,
  year,
  legacyWeek,
}: {
  sportId: string;
  year: number;
  legacyWeek: number;
}): Promise<string | null> {
  const { seasonType, weekNumber } =
    legacyWeekToSeasonTypeAndNumber(legacyWeek);

  const row = await db
    .select({ weekId: weeksTable.id })
    .from(weeksTable)
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .innerJoin(seasonsTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
    .where(
      and(
        eq(seasonsTable.sportId, sportId),
        eq(seasonsTable.year, year),
        eq(seasonTypesTable.type, seasonType),
        eq(weeksTable.number, weekNumber),
      ),
    )
    .limit(1);

  return row[0]?.weekId ?? null;
}

async function seedPolls(sportIdBySlug: Map<string, string>) {
  console.log("\n=== Seed polls ===");

  for (const seed of POLL_SEEDS) {
    const sportId = sportIdBySlug.get(seed.sportSlug);
    if (!sportId) {
      console.warn(`  skip ${seed.sportSlug}/${seed.slug}: sport not found`);
      continue;
    }

    const existing = await db.query.pollsTable.findFirst({
      where: (model, { eq: e, and: a }) =>
        a(e(model.sportId, sportId), e(model.slug, seed.slug)),
    });
    if (existing) {
      stats.pollsSkipped += 1;
      continue;
    }

    const [divisionSport] = await db
      .select({ id: divisionSportsTable.id })
      .from(divisionSportsTable)
      .innerJoin(
        divisionsTable,
        eq(divisionSportsTable.divisionId, divisionsTable.id),
      )
      .where(
        and(
          eq(divisionSportsTable.sportId, sportId),
          eq(divisionsTable.slug, seed.slug),
        ),
      )
      .limit(1);

    if (DRY_RUN) {
      console.log(
        `  [dry-run] create poll ${seed.sportSlug}/${seed.slug} (${seed.name})`,
      );
      stats.pollsCreated += 1;
      continue;
    }

    await db.insert(pollsTable).values({
      id: randomUUID(),
      sportId,
      slug: seed.slug,
      name: seed.name,
      isActive: true,
      divisionSportId: divisionSport?.id ?? null,
    });
    stats.pollsCreated += 1;
    console.log(`  created ${seed.sportSlug}/${seed.slug}`);
  }
}

async function loadPollMap(sportIdBySlug: Map<string, string>) {
  const polls = await db.select().from(pollsTable);
  const bySportAndSlug = new Map<string, (typeof polls)[number]>();
  for (const poll of polls) {
    bySportAndSlug.set(`${poll.sportId}:${poll.slug}`, poll);
  }

  // Also index by slug alone when unique among seeds for legacy rows missing sportId
  return { polls, bySportAndSlug, sportIdBySlug };
}

async function seedPollVoters(
  pollMap: Awaited<ReturnType<typeof loadPollMap>>,
) {
  console.log("\n=== Seed poll_voters from voter_ballot ===");

  const pairs = asRows<{
    userId: string;
    sportId: string | null;
    division: string;
  }>(
    await db.execute(sql`
      SELECT DISTINCT "userId" AS "userId", sport_id AS "sportId", division
      FROM voter_ballot
    `),
  );

  for (const pair of pairs) {
    let sportId = pair.sportId;
    if (!sportId) {
      // Infer football for classic football divisions when sport_id is null
      if (["fbs", "fcs"].includes(pair.division)) {
        sportId = pollMap.sportIdBySlug.get("football") ?? null;
      }
    }
    if (!sportId) {
      stats.unmappedPolls.add(`unknown-sport:${pair.division}`);
      continue;
    }

    const poll = pollMap.bySportAndSlug.get(`${sportId}:${pair.division}`);
    if (!poll) {
      stats.unmappedPolls.add(`${sportId}:${pair.division}`);
      continue;
    }

    const existing = await db.query.pollVotersTable.findFirst({
      where: (model, { eq: e, and: a }) =>
        a(e(model.pollId, poll.id), e(model.userId, pair.userId)),
    });

    if (existing) {
      if (existing.revokedAt && !DRY_RUN) {
        await db
          .update(pollVotersTable)
          .set({ revokedAt: null, updatedAt: new Date() })
          .where(eq(pollVotersTable.id, existing.id));
        stats.pollVotersCreated += 1;
      } else {
        stats.pollVotersSkipped += 1;
      }
      continue;
    }

    if (DRY_RUN) {
      stats.pollVotersCreated += 1;
      continue;
    }

    await db.insert(pollVotersTable).values({
      id: randomUUID(),
      pollId: poll.id,
      userId: pair.userId,
    });
    stats.pollVotersCreated += 1;
  }

  // Credentialed voters who never appear in voter_ballot
  const voters = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.isVoter, true));

  const votedUserIds = new Set(pairs.map((p) => p.userId));
  stats.neverVotedVoters = voters
    .map((v) => v.id)
    .filter((id) => !votedUserIds.has(id));

  if (stats.neverVotedVoters.length) {
    console.log(
      `  credentialed voters with no legacy ballots (${stats.neverVotedVoters.length}) — assign manually in admin:`,
    );
    for (const id of stats.neverVotedVoters.slice(0, 50)) {
      console.log(`    ${id}`);
    }
    if (stats.neverVotedVoters.length > 50) {
      console.log(`    …and ${stats.neverVotedVoters.length - 50} more`);
    }
  }
}

async function backfillBallots(
  pollMap: Awaited<ReturnType<typeof loadPollMap>>,
) {
  console.log("\n=== Backfill ballots + ballot_entries ===");

  const rows = asRows<LegacyBallotRow>(
    await db.execute(sql`
      SELECT
        "userId" AS "userId",
        division,
        week,
        year,
        created_at AS "createdAt",
        team_id AS "teamId",
        rank,
        points,
        sport_id AS "sportId"
      FROM voter_ballot
      ORDER BY year, week, "userId", rank
    `),
  );

  const schoolRows = await db
    .select({ id: schoolsTable.id, sanityId: schoolsTable.sanityId })
    .from(schoolsTable);
  const schoolBySanityId = new Map(
    schoolRows
      .filter((s): s is { id: string; sanityId: string } => !!s.sanityId)
      .map((s) => [s.sanityId, s.id]),
  );

  type Group = {
    key: string;
    userId: string;
    sportId: string;
    division: string;
    year: number;
    week: number;
    submittedAt: Date;
    entries: Array<{ schoolId: string; rank: number; points: number }>;
  };

  const groups = new Map<string, Group>();

  for (const row of rows) {
    let sportId = row.sportId;
    if (!sportId && ["fbs", "fcs"].includes(row.division)) {
      sportId = pollMap.sportIdBySlug.get("football") ?? null;
    }
    if (!sportId) {
      stats.unmappedPolls.add(`ballot-missing-sport:${row.division}`);
      continue;
    }

    const poll = pollMap.bySportAndSlug.get(`${sportId}:${row.division}`);
    if (!poll) {
      stats.unmappedPolls.add(`${sportId}:${row.division}`);
      continue;
    }

    const schoolId = schoolBySanityId.get(row.teamId);
    if (!schoolId) {
      stats.unmappedSchools.add(row.teamId);
      continue;
    }

    const key = `${poll.id}:${row.userId}:${row.year}:${row.week}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        userId: row.userId,
        sportId,
        division: row.division,
        year: row.year,
        week: row.week,
        submittedAt: row.createdAt,
        entries: [],
      };
      groups.set(key, group);
    }
    group.entries.push({
      schoolId,
      rank: row.rank,
      points: row.points,
    });
    if (row.createdAt < group.submittedAt) {
      group.submittedAt = row.createdAt;
    }
  }

  for (const group of groups.values()) {
    const poll = pollMap.bySportAndSlug.get(
      `${group.sportId}:${group.division}`,
    );
    if (!poll) continue;

    const weekId = await resolveWeekId({
      sportId: group.sportId,
      year: group.year,
      legacyWeek: group.week,
    });
    if (!weekId) {
      stats.unmappedWeeks.add(`${group.sportId}:${group.year}:${group.week}`);
      continue;
    }

    const existing = await db.query.ballotsTable.findFirst({
      where: (model, { eq: e, and: a }) =>
        a(
          e(model.pollId, poll.id),
          e(model.userId, group.userId),
          e(model.weekId, weekId),
        ),
    });
    if (existing) {
      stats.ballotsSkipped += 1;
      continue;
    }

    if (DRY_RUN) {
      stats.ballotsCreated += 1;
      stats.ballotEntriesCreated += group.entries.length;
      continue;
    }

    const ballotId = randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(ballotsTable).values({
        id: ballotId,
        pollId: poll.id,
        userId: group.userId,
        weekId,
        submittedAt: group.submittedAt,
      });
      if (group.entries.length) {
        await tx.insert(ballotEntriesTable).values(
          group.entries.map((entry) => ({
            id: randomUUID(),
            ballotId,
            schoolId: entry.schoolId,
            rank: entry.rank,
            points: entry.points,
          })),
        );
      }
    });
    stats.ballotsCreated += 1;
    stats.ballotEntriesCreated += group.entries.length;
  }

  console.log(
    `  groups=${groups.size} created=${stats.ballotsCreated} skipped=${stats.ballotsSkipped}`,
  );
}

async function backfillRankings(
  pollMap: Awaited<ReturnType<typeof loadPollMap>>,
) {
  console.log("\n=== Backfill poll_rankings from weekly_final_rankings ===");

  const rows = asRows<LegacyRankingRow>(
    await db.execute(sql`
      SELECT
        id,
        division,
        sport_id AS "sportId",
        week,
        year,
        rankings
      FROM weekly_final_rankings
      ORDER BY year, week, division
    `),
  );

  const schoolRows = await db
    .select({ id: schoolsTable.id, sanityId: schoolsTable.sanityId })
    .from(schoolsTable);
  const schoolBySanityId = new Map(
    schoolRows
      .filter((s): s is { id: string; sanityId: string } => !!s.sanityId)
      .map((s) => [s.sanityId, s.id]),
  );

  for (const row of rows) {
    let sportId = row.sportId;
    if (!sportId && ["fbs", "fcs"].includes(row.division)) {
      sportId = pollMap.sportIdBySlug.get("football") ?? null;
    }
    if (!sportId) {
      stats.unmappedPolls.add(`rankings-missing-sport:${row.division}`);
      continue;
    }

    const poll = pollMap.bySportAndSlug.get(`${sportId}:${row.division}`);
    if (!poll) {
      stats.unmappedPolls.add(`${sportId}:${row.division}`);
      continue;
    }

    const weekId = await resolveWeekId({
      sportId,
      year: row.year,
      legacyWeek: row.week,
    });
    if (!weekId) {
      stats.unmappedWeeks.add(`${sportId}:${row.year}:${row.week}`);
      continue;
    }

    const existingCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(pollRankingsTable)
      .where(
        and(
          eq(pollRankingsTable.pollId, poll.id),
          eq(pollRankingsTable.weekId, weekId),
        ),
      );
    if ((existingCount[0]?.count ?? 0) > 0) {
      stats.rankingsWeeksSkipped += 1;
      continue;
    }

    const teams = (
      Array.isArray(row.rankings) ? row.rankings : []
    ) as RankingTeam[];

    const rankingRows: Array<{
      schoolId: string;
      rank: number | null;
      points: number;
      firstPlaceVotes: number;
      isTie: boolean;
    }> = [];

    for (const team of teams) {
      const sanityId = team._id ?? team.id;
      if (!sanityId) continue;
      const schoolId = schoolBySanityId.get(sanityId);
      if (!schoolId) {
        stats.unmappedSchools.add(sanityId);
        continue;
      }
      rankingRows.push({
        schoolId,
        rank: typeof team.rank === "number" ? team.rank : null,
        points: team._points ?? team.points ?? 0,
        firstPlaceVotes: team.firstPlaceVotes ?? 0,
        isTie: Boolean(team.isTie),
      });
    }

    if (!rankingRows.length) {
      continue;
    }

    if (DRY_RUN) {
      stats.rankingsWeeksCreated += 1;
      stats.rankingRowsCreated += rankingRows.length;
      continue;
    }

    await db.insert(pollRankingsTable).values(
      rankingRows.map((r) => ({
        id: randomUUID(),
        pollId: poll.id,
        weekId,
        schoolId: r.schoolId,
        rank: r.rank,
        points: r.points,
        firstPlaceVotes: r.firstPlaceVotes,
        isTie: r.isTie,
      })),
    );
    stats.rankingsWeeksCreated += 1;
    stats.rankingRowsCreated += rankingRows.length;
  }

  console.log(
    `  weeks created=${stats.rankingsWeeksCreated} skipped=${stats.rankingsWeeksSkipped} rows=${stats.rankingRowsCreated}`,
  );
}

async function verify() {
  console.log("\n=== Verification ===");

  const legacyBallotGroups = asRows<{ count: number }>(
    await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM (
        SELECT 1
        FROM voter_ballot
        GROUP BY "userId", COALESCE(sport_id, ''), division, year, week
      ) t
    `),
  );

  const [ballotCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ballotsTable);

  const legacyRankingWeeks = asRows<{ count: number }>(
    await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM weekly_final_rankings
    `),
  );

  const rankingWeekRows = asRows<{ count: number }>(
    await db.execute(sql`
      SELECT COUNT(*)::int AS count FROM (
        SELECT 1 FROM poll_rankings GROUP BY poll_id, week_id
      ) t
    `),
  );

  console.log(
    `  legacy ballot groups ≈ ${legacyBallotGroups[0]?.count ?? "?"} | ballots = ${ballotCount?.count ?? 0}`,
  );
  console.log(
    `  legacy ranking weeks = ${legacyRankingWeeks[0]?.count ?? "?"} | poll_rankings weeks = ${rankingWeekRows[0]?.count ?? 0}`,
  );

  const pollCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pollsTable);
  const voterCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pollVotersTable);
  console.log(
    `  polls = ${pollCount[0]?.count ?? 0} | poll_voters = ${voterCount[0]?.count ?? 0}`,
  );
}

function printSummary() {
  console.log("\n=== Summary ===");
  console.log(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        ...stats,
        unmappedSchools: [...stats.unmappedSchools].slice(0, 20),
        unmappedSchoolsTotal: stats.unmappedSchools.size,
        unmappedWeeks: [...stats.unmappedWeeks].slice(0, 20),
        unmappedWeeksTotal: stats.unmappedWeeks.size,
        unmappedPolls: [...stats.unmappedPolls],
        neverVotedVotersCount: stats.neverVotedVoters.length,
      },
      null,
      2,
    ),
  );
}

async function main() {
  console.log(
    `Backfill poll engine${DRY_RUN ? " (dry-run)" : ""}${VERIFY_ONLY ? " (verify-only)" : ""}`,
  );

  if (VERIFY_ONLY) {
    await verify();
    return;
  }

  const sports = await db.select().from(sportsTable);
  const sportIdBySlug = new Map(sports.map((s) => [s.slug, s.id]));
  if (!sportIdBySlug.size) {
    throw new Error(
      "No sports found. Run admin Development loaders (Sports) before backfill.",
    );
  }

  await seedPolls(sportIdBySlug);
  const pollMap = await loadPollMap(sportIdBySlug);
  await seedPollVoters(pollMap);
  await backfillBallots(pollMap);
  await backfillRankings(pollMap);
  await verify();
  printSummary();
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
