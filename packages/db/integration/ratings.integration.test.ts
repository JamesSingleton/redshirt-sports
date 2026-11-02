import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { FCS_FOOTBALL_DEFAULTS } from "../src/ratings/engine/config";
import {
  JobBusyError,
  publishRun,
  unpublishWeek,
  withJob,
} from "../src/ratings/jobs/lifecycle";
import {
  getPublishedRun,
  listPublishedWeeks,
} from "../src/ratings/jobs/public";
import {
  divisionSportsTable,
  divisionsTable,
  ratingJobsTable,
  ratingPoolsTable,
  ratingRunsTable,
  seasonsTable,
} from "../src/schema";
import {
  createPollWeekFixture,
  db,
  type PollWeekFixture,
  resetDatabase,
} from "./fixtures";

let fixture: PollWeekFixture;
let poolId: string;
let seasonId: string;

async function createRun(
  weekId: string,
  blockers: Array<{ games: number }> = [],
) {
  const [run] = await db
    .insert(ratingRunsTable)
    .values({
      poolId,
      seasonId,
      weekId,
      methodVersion: 1,
      params: FCS_FOOTBALL_DEFAULTS,
      diagnostics: {
        unmappedMembers: blockers.map((b, i) => ({
          externalId: `${i}`,
          name: `Team ${i}`,
          ...b,
        })),
      },
      checksum: randomUUID(),
      gameCount: 10,
      trigger: "cli",
    })
    .returning({ id: ratingRunsTable.id });
  return run!.id;
}

async function statusOf(runId: string) {
  const [row] = await db
    .select({ status: ratingRunsTable.status })
    .from(ratingRunsTable)
    .where(eq(ratingRunsTable.id, runId));
  return row?.status;
}

beforeEach(async () => {
  await resetDatabase();
  fixture = await createPollWeekFixture({ weekCount: 2 });
  const [division] = await db
    .insert(divisionsTable)
    .values({ name: "FCS", slug: "fcs" })
    .returning();
  const [divisionSport] = await db
    .insert(divisionSportsTable)
    .values({ sportId: fixture.sportId, divisionId: division!.id })
    .returning();
  const [pool] = await db
    .insert(ratingPoolsTable)
    .values({
      divisionSportId: divisionSport!.id,
      sportId: fixture.sportId,
      slug: "fcs",
      name: "FCS",
      isActive: true,
      isPublic: true,
      membership: { type: "espn_group", groupId: "81" },
      source: {
        espnLeague: "football/college-football",
        scoreboardGroups: "81",
        regulationPeriods: 4,
        ncaaPath: null,
      },
      schedule: { cadence: "weekly", windows: [] },
      config: FCS_FOOTBALL_DEFAULTS,
      methodVersion: 1,
    })
    .returning();
  poolId = pool!.id;
  const [season] = await db
    .select({ id: seasonsTable.id })
    .from(seasonsTable)
    .where(eq(seasonsTable.sportId, fixture.sportId));
  seasonId = season!.id;
});

describe("rating runs", () => {
  it("publishing supersedes the week's previous run; republishing an older run rolls back", async () => {
    const week = fixture.weekIds[0]!;
    const first = await createRun(week);
    const second = await createRun(week);

    await publishRun(first, "tester");
    expect(await statusOf(first)).toBe("published");

    await publishRun(second, "tester");
    expect(await statusOf(first)).toBe("superseded");
    expect(await statusOf(second)).toBe("published");

    await publishRun(first, "tester");
    expect(await statusOf(first)).toBe("published");
    expect(await statusOf(second)).toBe("superseded");

    const weeks = await listPublishedWeeks(poolId);
    expect(weeks.map((w) => w.runId)).toEqual([first]);
    expect(weeks[0]?.segment).toBe("1");
  });

  it("publishes each week independently", async () => {
    const one = await createRun(fixture.weekIds[0]!);
    const two = await createRun(fixture.weekIds[1]!);
    await publishRun(one, null);
    await publishRun(two, null);
    expect(await statusOf(one)).toBe("published");
    expect((await listPublishedWeeks(poolId)).map((w) => w.segment)).toEqual([
      "2",
      "1",
    ]);
  });

  it("the database refuses two published runs for one week", async () => {
    const week = fixture.weekIds[0]!;
    const a = await createRun(week);
    const b = await createRun(week);
    await db
      .update(ratingRunsTable)
      .set({ status: "published" })
      .where(eq(ratingRunsTable.id, a));
    await expect(
      db
        .update(ratingRunsTable)
        .set({ status: "published" })
        .where(eq(ratingRunsTable.id, b)),
    ).rejects.toThrow();
  });

  it("refuses to publish a run with unmapped members who played, unless told to", async () => {
    const run = await createRun(fixture.weekIds[0]!, [
      { games: 3 },
      { games: 0 },
    ]);
    await expect(publishRun(run, null)).rejects.toThrow(
      /1 pool member\(s\) with games have no Redshirt school/,
    );
    expect(await statusOf(run)).toBe("draft");
    await publishRun(run, null, { allowBlockers: true });
    expect(await statusOf(run)).toBe("published");
  });

  it("only published runs are readable publicly; unpublishing hides the week", async () => {
    const run = await createRun(fixture.weekIds[0]!);
    expect(await getPublishedRun(run)).toBeNull();
    await publishRun(run, null);
    expect((await getPublishedRun(run))?.run.id).toBe(run);
    expect(await unpublishWeek(poolId, fixture.weekIds[0]!)).toBe(1);
    expect(await getPublishedRun(run)).toBeNull();
    expect(await listPublishedWeeks(poolId)).toEqual([]);
  });
});

describe("job lock", () => {
  it("lets one job run per pool and logs both outcomes", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const running = withJob(
      { poolId, kind: "pipeline", trigger: "cron" },
      async (job) => {
        job.log("started");
        await gate;
        return { value: "done" };
      },
    );
    // Give the first job time to take the lock.
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect(
      withJob({ poolId, kind: "sync", trigger: "admin" }, async () => ({
        value: null,
      })),
    ).rejects.toBeInstanceOf(JobBusyError);
    release();
    await expect(running).resolves.toMatchObject({ value: "done" });

    const jobs = await db
      .select()
      .from(ratingJobsTable)
      .where(eq(ratingJobsTable.poolId, poolId));
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ status: "succeeded", lines: ["started"] });
  });

  it("records a failure and frees the lock", async () => {
    await expect(
      withJob({ poolId, kind: "compute", trigger: "admin" }, async () => {
        throw new Error("ESPN down");
      }),
    ).rejects.toThrow("ESPN down");
    await expect(
      withJob({ poolId, kind: "compute", trigger: "admin" }, async () => ({
        value: 1,
        status: "skipped",
      })),
    ).resolves.toMatchObject({ value: 1 });
    const statuses = (await db.select().from(ratingJobsTable)).map((job) => [
      job.status,
      job.error,
    ]);
    expect(statuses).toEqual(
      expect.arrayContaining([
        ["failed", "ESPN down"],
        ["skipped", null],
      ]),
    );
  });

  it("clears a job stuck running for over 15 minutes", async () => {
    await db.insert(ratingJobsTable).values({
      poolId,
      kind: "pipeline",
      trigger: "cron",
      status: "running",
      startedAt: new Date(Date.now() - 20 * 60 * 1000),
    });
    await expect(
      withJob({ poolId, kind: "pipeline", trigger: "cron" }, async () => ({
        value: "ok",
      })),
    ).resolves.toMatchObject({ value: "ok" });
    const stuck = await db
      .select()
      .from(ratingJobsTable)
      .where(eq(ratingJobsTable.status, "failed"));
    expect(stuck[0]?.error).toMatch(/Timed out/);
  });
});
