import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), "../../apps/web/.env.local") });

import { asc, desc, eq } from "drizzle-orm";

import { primaryDb as db } from "../src/client";
import {
  ballotEntriesTable,
  ballotsTable,
  pollVotersTable,
  seasonsTable,
  seasonTypesTable,
  usersTable,
  weeksTable,
} from "../src/schema";

const SEED_USERS = [
  {
    id: "user_seed_1",
    firstName: "Marcus",
    lastName: "Thompson",
    organization: "ESPN",
    organizationRole: "Senior Writer",
  },
  {
    id: "user_seed_2",
    firstName: "Sarah",
    lastName: "Chen",
    organization: "The Athletic",
    organizationRole: "College Football Analyst",
  },
  {
    id: "user_seed_3",
    firstName: "James",
    lastName: "Mitchell",
    organization: "Sports Illustrated",
    organizationRole: "Senior Editor",
  },
  {
    id: "user_seed_4",
    firstName: "Elena",
    lastName: "Rodriguez",
    organization: "FOX Sports",
    organizationRole: "Columnist",
  },
  {
    id: "user_seed_5",
    firstName: "David",
    lastName: "Park",
    organization: "CBS Sports",
    organizationRole: "Beat Writer",
  },
];

async function seed() {
  console.log("Seeding database...\n");

  // 1. Create voter users
  console.log("Creating voter users...");
  for (const user of SEED_USERS) {
    await db
      .insert(usersTable)
      .values({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        organization: user.organization,
        organizationRole: user.organizationRole,
        isVoter: true,
        isAdmin: false,
      })
      .onConflictDoNothing();
  }
  console.log(`  Created ${SEED_USERS.length} voter users`);

  // 2. Find first active poll
  const poll = await db.query.pollsTable.findFirst({
    where: (model, { eq }) => eq(model.isActive, true),
    with: { sport: true },
  });

  if (!poll) {
    console.log(
      "  No active poll found. Skipping poll assignment and ballots.",
    );
    console.log("\nSeeding complete.");
    return;
  }

  console.log(`  Using poll: ${poll.name} (${poll.slug})`);

  // 3. Assign all seed users to the poll
  console.log("Assigning users to poll...");
  for (const user of SEED_USERS) {
    // Ensure user is a voter (in case re-running after credential removal)
    await db
      .update(usersTable)
      .set({ isVoter: true })
      .where(eq(usersTable.id, user.id));

    const existing = await db.query.pollVotersTable.findFirst({
      where: (model, { eq, and }) =>
        and(eq(model.pollId, poll.id), eq(model.userId, user.id)),
    });

    if (existing) {
      if (existing.revokedAt) {
        await db
          .update(pollVotersTable)
          .set({ revokedAt: null, updatedAt: new Date() })
          .where(eq(pollVotersTable.id, existing.id));
      }
    } else {
      await db.insert(pollVotersTable).values({
        pollId: poll.id,
        userId: user.id,
      });
    }
  }
  console.log(`  Assigned ${SEED_USERS.length} users to poll`);

  // 4. Find top-25-eligible schools
  const schools = await db.query.schoolsTable.findMany({
    where: (model, { eq }) => eq(model.top25Eligible, true),
    orderBy: (model, { asc }) => [asc(model.name)],
  });

  if (schools.length < 25) {
    console.log(
      `  Only ${schools.length} top-25-eligible schools found. Need at least 25. Skipping ballots.`,
    );
    console.log("\nSeeding complete.");
    return;
  }

  const ballotSchools = schools.slice(0, 25);
  console.log(`  Using 25 top-25-eligible schools`);

  // 5. Find the most recent week for this poll's sport
  const latestWeek = await db
    .select({
      weekId: weeksTable.id,
      weekNumber: weeksTable.number,
      seasonType: seasonTypesTable.type,
      year: seasonsTable.year,
    })
    .from(weeksTable)
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .innerJoin(seasonsTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
    .where(eq(seasonsTable.sportId, poll.sportId))
    .orderBy(
      desc(seasonsTable.year),
      asc(seasonTypesTable.type),
      asc(weeksTable.number),
    )
    .limit(1);

  if (latestWeek.length === 0) {
    console.log("  No weeks found for this sport. Skipping ballots.");
    console.log("\nSeeding complete.");
    return;
  }

  const week = latestWeek[0];
  console.log(
    `  Using week: Year ${week.year}, SeasonType ${week.seasonType}, Week ${week.weekNumber}`,
  );

  // 6. Submit sample ballots for 3 of the 5 voters
  console.log("Submitting sample ballots...");

  // Base ranking: schools 0-24 in order
  const baseRanking = ballotSchools.map((school, i) => ({
    schoolId: school.id,
    rank: i + 1,
    points: 25 - i,
  }));

  // Create 3 slightly different ballots by swapping a few positions
  const ballotVariations = [
    // Ballot 1: base ranking (no changes)
    baseRanking,
    // Ballot 2: swap #1 and #3, shuffle a couple in the middle
    baseRanking.map((entry) => {
      if (entry.rank === 1) return { ...entry, rank: 3, points: 23 };
      if (entry.rank === 3) return { ...entry, rank: 1, points: 25 };
      if (entry.rank === 10) return { ...entry, rank: 12, points: 14 };
      if (entry.rank === 12) return { ...entry, rank: 10, points: 16 };
      return entry;
    }),
    // Ballot 3: different top 5, swap #2 and #5
    baseRanking.map((entry) => {
      if (entry.rank === 2) return { ...entry, rank: 5, points: 21 };
      if (entry.rank === 5) return { ...entry, rank: 2, points: 24 };
      if (entry.rank === 7) return { ...entry, rank: 8, points: 18 };
      if (entry.rank === 8) return { ...entry, rank: 7, points: 19 };
      return entry;
    }),
  ];

  const votersToSubmit = SEED_USERS.slice(0, 3);

  for (let i = 0; i < votersToSubmit.length; i++) {
    const user = votersToSubmit[i];
    const entries = ballotVariations[i];

    // Check if ballot already exists
    const existingBallot = await db.query.ballotsTable.findFirst({
      where: (model, { eq, and }) =>
        and(
          eq(model.pollId, poll.id),
          eq(model.userId, user.id),
          eq(model.weekId, week.weekId),
        ),
    });

    if (existingBallot) {
      console.log(
        `  ${user.firstName} ${user.lastName}: ballot already exists, skipping`,
      );
      continue;
    }

    await db.transaction(async (tx) => {
      const [ballot] = await tx
        .insert(ballotsTable)
        .values({
          pollId: poll.id,
          userId: user.id,
          weekId: week.weekId,
        })
        .returning();

      if (!ballot) throw new Error("Failed to create ballot");

      await tx.insert(ballotEntriesTable).values(
        entries.map((entry) => ({
          ballotId: ballot.id,
          schoolId: entry.schoolId,
          rank: entry.rank,
          points: entry.points,
        })),
      );
    });

    console.log(
      `  ${user.firstName} ${user.lastName}: submitted ballot (ranked #1: ${ballotSchools[0]?.name ?? "unknown"})`,
    );
  }

  // 7. Leave 2 voters without ballots (to show "missing" status in admin)
  console.log(
    `  ${SEED_USERS[3]?.firstName} ${SEED_USERS[3]?.lastName}: no ballot (missing)`,
  );
  console.log(
    `  ${SEED_USERS[4]?.firstName} ${SEED_USERS[4]?.lastName}: no ballot (missing)`,
  );

  console.log("\nSeeding complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
