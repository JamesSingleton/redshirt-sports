/**
 * Dev seed for players, transfer portal entries, and recruiting data.
 *
 * Usage (from repo root):
 *   pnpm --filter @redshirt-sports/web exec tsx ../../packages/db/scripts/seed-players-portal.ts
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { primaryDb as db } from "../src/client";
import {
  highSchoolsTable,
  playerOrganizationHistoryTable,
  playersTable,
  playerTimelineTable,
  schoolsTable,
  sportsTable,
  transferPortalEntriesTable,
} from "../src/schema";

async function getOrCreateSport(slug: string, name: string) {
  const [existing] = await db
    .select()
    .from(sportsTable)
    .where(eq(sportsTable.slug, slug))
    .limit(1);

  if (existing) return existing;

  const id = randomUUID();
  await db.insert(sportsTable).values({ id, slug, name, displayName: name });
  const [created] = await db
    .select()
    .from(sportsTable)
    .where(eq(sportsTable.id, id))
    .limit(1);
  return created!;
}

async function getFirstSchool() {
  const [school] = await db.select().from(schoolsTable).limit(1);
  return school ?? null;
}

async function main() {
  const football = await getOrCreateSport("football", "Football");
  const basketball = await getOrCreateSport(
    "mens-basketball",
    "Men's Basketball",
  );
  const school = await getFirstSchool();

  if (!school) {
    console.error("No schools found in database. Seed schools first.");
    process.exit(1);
  }

  const highSchoolId = randomUUID();
  await db
    .insert(highSchoolsTable)
    .values({
      id: highSchoolId,
      slug: "sample-high-school",
      fullName: "Sample High School",
      shortName: "Sample HS",
      city: "Austin",
      state: "TX",
    })
    .onConflictDoNothing();

  const playerId = randomUUID();
  const playerSlug = "sample-quarterback";

  await db
    .insert(playersTable)
    .values({
      id: playerId,
      slug: playerSlug,
      firstName: "Sample",
      lastName: "Quarterback",
      displayName: "Sample Quarterback",
      sportId: football.id,
      position: "QB",
      classYear: 2026,
      heightInches: 75,
      weightLbs: 210,
      hometown: "Austin, TX",
      highSchool: "Sample High School",
      highSchoolId,
      lastSchoolId: school.id,
      committedSchoolId: school.id,
      currentStatus: "Committed",
      bio: "Sample player profile for local development.",
    })
    .onConflictDoNothing();

  const portalEntryId = randomUUID();
  const now = new Date();

  await db
    .insert(transferPortalEntriesTable)
    .values({
      id: portalEntryId,
      playerId,
      status: "COMMITTED",
      portalYear: 2026,
      fromSchoolId: school.id,
      toSchoolId: school.id,
      committedAt: now,
      eventDate: now,
    })
    .onConflictDoNothing();

  await db
    .insert(playerOrganizationHistoryTable)
    .values({
      id: randomUUID(),
      playerId,
      schoolId: school.id,
      startYear: 2024,
      endYear: 2026,
      isTransfer: true,
    })
    .onConflictDoNothing();

  await db
    .insert(playerTimelineTable)
    .values({
      id: randomUUID(),
      playerId,
      eventType: "commitment",
      label: "Committed",
      schoolId: school.id,
      sportId: football.id,
      startDate: now,
    })
    .onConflictDoNothing();

  const basketballPlayerId = randomUUID();
  await db
    .insert(playersTable)
    .values({
      id: basketballPlayerId,
      slug: "sample-guard",
      firstName: "Sample",
      lastName: "Guard",
      sportId: basketball.id,
      position: "G",
      classYear: 2026,
      hometown: "Dallas, TX",
      currentStatus: "Prospect",
    })
    .onConflictDoNothing();

  console.log("Seed complete.");
  console.log(`Player profile: /player/${playerSlug}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
