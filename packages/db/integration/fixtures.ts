import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";

import { primaryDb as db } from "../src/client";
import { lockPollWeek } from "../src/queries/voting";
import {
  ballotsTable,
  pollsTable,
  pollVotersTable,
  SEASON_TYPE_CODES,
  schoolsTable,
  seasonsTable,
  seasonTypesTable,
  sportsTable,
  usersTable,
  weeksTable,
} from "../src/schema";
import { assertIntegrationDatabaseUrl } from "./database-url";

export { db };

export const FIXTURE_YEAR = 2026;
export const FIXTURE_POLL_SLUG = "fcs";

/** Empty every app table; migrations bookkeeping lives in the `drizzle` schema. */
export async function resetDatabase() {
  assertIntegrationDatabaseUrl(process.env.DATABASE_URL ?? "");
  const rows = await db.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`,
  );
  if (rows.length === 0) return;
  const tables = rows.map((row) => `"public"."${row.tablename}"`).join(", ");
  await db.execute(
    sql.raw(`truncate table ${tables} restart identity cascade`),
  );
}

export type PollWeekFixture = Awaited<ReturnType<typeof createPollWeekFixture>>;

/** One sport with a season, regular-season weeks 1..weekCount, a poll, and 25 schools. */
export async function createPollWeekFixture({ weekCount = 1 } = {}) {
  const sportSlug = `it-${randomUUID().slice(0, 8)}`;
  const [sport] = await db
    .insert(sportsTable)
    .values({ id: randomUUID(), slug: sportSlug, name: "Integration Football" })
    .returning();

  const [season] = await db
    .insert(seasonsTable)
    .values({
      year: FIXTURE_YEAR,
      sportId: sport!.id,
      startDate: new Date(`${FIXTURE_YEAR}-08-01T00:00:00Z`),
      endDate: new Date(`${FIXTURE_YEAR + 1}-01-31T00:00:00Z`),
    })
    .returning();

  const [seasonType] = await db
    .insert(seasonTypesTable)
    .values({
      type: SEASON_TYPE_CODES.REGULAR_SEASON,
      seasonId: season!.id,
      startDate: new Date(`${FIXTURE_YEAR}-08-20T00:00:00Z`),
      endDate: new Date(`${FIXTURE_YEAR}-12-01T00:00:00Z`),
    })
    .returning();

  const weeks = await db
    .insert(weeksTable)
    .values(
      Array.from({ length: weekCount }, (_, index) => ({
        number: index + 1,
        seasonTypeId: seasonType!.id,
        startDate: new Date(Date.UTC(FIXTURE_YEAR, 7, 25 + index * 7)),
        endDate: new Date(Date.UTC(FIXTURE_YEAR, 7, 31 + index * 7)),
      })),
    )
    .returning();

  const [poll] = await db
    .insert(pollsTable)
    .values({ sportId: sport!.id, slug: FIXTURE_POLL_SLUG, name: "FCS Top 25" })
    .returning();

  const schools = await db
    .insert(schoolsTable)
    .values(
      Array.from({ length: 25 }, (_, index) => ({
        name: `School ${index + 1}`,
        sanityId: `sanity-school-${sportSlug}-${index + 1}`,
      })),
    )
    .returning();

  return {
    sportSlug,
    sportId: sport!.id,
    pollId: poll!.id,
    weekIds: weeks.map((week) => week.id),
    schoolIds: schools.map((school) => school.id),
  };
}

/** A credentialed voter assigned to the fixture's poll. */
export async function createVoter(
  fixture: PollWeekFixture,
  overrides: Partial<typeof usersTable.$inferInsert> = {},
) {
  const [user] = await db
    .insert(usersTable)
    .values({
      id: `user_${randomUUID()}`,
      firstName: "Test",
      lastName: "Voter",
      organization: "Test Org",
      isVoter: true,
      ...overrides,
    })
    .returning();
  await db
    .insert(pollVotersTable)
    .values({ pollId: fixture.pollId, userId: user!.id });
  return user!;
}

/** A full Top 25 ballot; `offset` rotates the order so ballots differ. */
export function ballotEntries(fixture: PollWeekFixture, offset = 0) {
  const count = fixture.schoolIds.length;
  return Array.from({ length: count }, (_, index) => ({
    schoolId: fixture.schoolIds[(index + offset) % count]!,
    rank: index + 1,
    points: count - index,
  }));
}

export async function countBallots() {
  const rows = await db.select({ id: ballotsTable.id }).from(ballotsTable);
  return rows.length;
}

/** Advisory locks still held by any session; should be none between operations. */
export async function heldAdvisoryLocks() {
  const rows = await db.execute<{ count: number }>(
    sql`select count(*)::int as count from pg_locks where locktype = 'advisory' and granted and database = (select oid from pg_database where datname = current_database())`,
  );
  return rows[0]!.count;
}

/** Wait until some session is blocked waiting on an advisory lock. */
export async function waitForAdvisoryLockWaiter(timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const rows = await db.execute<{ count: number }>(
      sql`select count(*)::int as count from pg_locks where locktype = 'advisory' and not granted and database = (select oid from pg_database where datname = current_database())`,
    );
    if (rows[0]!.count > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("No session started waiting on an advisory lock");
}

/** Resolve to "pending" if the promise hasn't settled within `ms`. */
export async function settledWithin<T>(promise: Promise<T>, ms: number) {
  const timeout = new Promise<"pending">((resolve) =>
    setTimeout(() => resolve("pending"), ms),
  );
  return Promise.race([promise.then(() => "settled" as const), timeout]);
}

const openLockHolders = new Set<{ release: () => void; done: Promise<void> }>();

/**
 * Hold one poll/week lock in an open transaction until `release` is called.
 * Call `releaseLockHolders` in afterEach so a failed test can't leave a
 * holder open and block the tests after it.
 */
export function holdPollWeekLock(pollId: string, weekId: string) {
  let release!: () => void;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  let acquired!: () => void;
  const ready = new Promise<void>((resolve) => {
    acquired = resolve;
  });
  const done = db.transaction(async (tx) => {
    await lockPollWeek(tx, pollId, weekId);
    acquired();
    await released;
  });
  const holder = { ready, release, done };
  openLockHolders.add(holder);
  return holder;
}

export async function releaseLockHolders() {
  for (const holder of openLockHolders) holder.release();
  await Promise.allSettled([...openLockHolders].map((holder) => holder.done));
  openLockHolders.clear();
}
