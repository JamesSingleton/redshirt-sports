"use server";

import { auth } from "@redshirt-sports/auth/server";
import {
  computeRun,
  getPoolById,
  JobBusyError,
  listJobs,
  listPools,
  listRuns,
  loadRatingInputs,
  loadSeasonCalendar,
  mapExternalId,
  poolOverview,
  publishRun,
  runDiff,
  runPipeline,
  searchSchools,
  setPoolFlags,
  syncPoolWeeks,
  unmappedTeams,
  unpublishWeek,
  withJob,
} from "@redshirt-sports/db/ratings";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { requireAdmin } from "@/lib/require-admin";
import { revalidateWebRatingsCache } from "@/lib/revalidate-web-ratings";

export type RatingsActionResult = {
  ok: boolean;
  message: string;
  lines: string[];
};

async function actor(): Promise<string> {
  const { userId } = await auth();
  return userId ?? "admin";
}

function failure(error: unknown, lines: string[] = []): RatingsActionResult {
  const message =
    error instanceof JobBusyError || error instanceof Error
      ? error.message
      : "The ratings job failed.";
  return { ok: false, message, lines };
}

function refresh(sportSlug: string, poolSlug: string, publicChange: boolean) {
  after(async () => {
    revalidatePath("/ratings");
    if (publicChange) await revalidateWebRatingsCache(sportSlug, poolSlug);
  });
}

export async function getRatingsBootstrap() {
  await requireAdmin();
  const pools = await listPools();
  return Promise.all(
    pools.map(async (pool) => ({
      id: pool.id,
      name: pool.name,
      slug: pool.slug,
      sportSlug: pool.sportSlug,
      isActive: pool.isActive,
      isPublic: pool.isPublic,
      methodVersion: pool.methodVersion,
      overview: await poolOverview(pool),
      runs: await listRuns(pool.id),
      jobs: await listJobs(pool.id),
    })),
  );
}

export type RatingsBootstrap = Awaited<ReturnType<typeof getRatingsBootstrap>>;
export type RatingsPoolState = RatingsBootstrap[number];

/** What the cron does, now: sync this week, and publish if the weekend is complete (or if forced). */
export async function runPipelineNow(input: {
  poolId: string;
  ignoreCompleteness: boolean;
}): Promise<RatingsActionResult> {
  await requireAdmin();
  const pool = await getPoolById(input.poolId);
  try {
    const result = await runPipeline({
      pool,
      trigger: "admin",
      actor: await actor(),
      ignoreSchedule: true,
      ignoreCompleteness: input.ignoreCompleteness,
    });
    refresh(pool.sportSlug, pool.slug, result.status === "published");
    return {
      ok: result.status !== "blocked",
      message: result.message,
      lines: result.lines,
    };
  } catch (error) {
    return failure(error);
  }
}

/** Pull games for one week or the whole season. */
export async function syncRatings(input: {
  poolId: string;
  year: number;
  weekId: string | "all";
}): Promise<RatingsActionResult> {
  await requireAdmin();
  const pool = await getPoolById(input.poolId);
  try {
    const calendar = await loadSeasonCalendar(pool.sportId, input.year);
    const weeks =
      input.weekId === "all"
        ? calendar.weeks
        : calendar.weeks.filter((w) => w.id === input.weekId);
    if (weeks.length === 0) throw new Error("Pick a week.");
    const { job } = await withJob(
      {
        poolId: pool.id,
        kind: "sync",
        trigger: "admin",
        actor: await actor(),
        request: input,
      },
      async (job) => {
        await syncPoolWeeks({
          pool,
          calendar,
          weeks,
          now: new Date(),
          log: job.log,
        });
        return { value: null };
      },
    );
    refresh(pool.sportSlug, pool.slug, false);
    return {
      ok: true,
      message: `Synced ${weeks.length} week(s).`,
      lines: job.lines,
    };
  } catch (error) {
    return failure(error);
  }
}

/** Compute draft runs for one week or the whole season. Nothing goes public. */
export async function computeRatings(input: {
  poolId: string;
  year: number;
  weekId: string | "all";
  force: boolean;
}): Promise<RatingsActionResult> {
  await requireAdmin();
  const pool = await getPoolById(input.poolId);
  try {
    const calendar = await loadSeasonCalendar(pool.sportId, input.year);
    const weeks =
      input.weekId === "all"
        ? calendar.weeks
        : calendar.weeks.filter((w) => w.id === input.weekId);
    if (weeks.length === 0) throw new Error("Pick a week.");
    const { job } = await withJob(
      {
        poolId: pool.id,
        kind: "compute",
        trigger: "admin",
        actor: await actor(),
        request: input,
      },
      async (job) => {
        const inputs = await loadRatingInputs(pool, calendar);
        let lastRun: string | null = null;
        for (const week of weeks) {
          const outcome = await computeRun({
            pool,
            calendar,
            week,
            trigger: "admin",
            force: input.force,
            inputs,
          });
          lastRun = outcome.runId;
          job.log(
            outcome.status === "skipped"
              ? `${week.label}: skipped (${outcome.reason}).`
              : `${week.label}: draft ${outcome.runId.slice(0, 8)} from ${outcome.result.diagnostics.poolGamesPlayed} pool games.`,
          );
        }
        return { value: null, runId: lastRun };
      },
    );
    refresh(pool.sportSlug, pool.slug, false);
    return {
      ok: true,
      message: `Computed ${weeks.length} week(s) as drafts.`,
      lines: job.lines,
    };
  } catch (error) {
    return failure(error);
  }
}

/** Publish a run (a newer draft, or an older run to roll back). */
export async function publishRatingsRun(input: {
  poolId: string;
  runId: string;
  allowBlockers: boolean;
}): Promise<RatingsActionResult> {
  await requireAdmin();
  const pool = await getPoolById(input.poolId);
  try {
    const who = await actor();
    await withJob(
      {
        poolId: pool.id,
        kind: "publish",
        trigger: "admin",
        actor: who,
        request: input,
      },
      async (job) => {
        await publishRun(input.runId, who, {
          allowBlockers: input.allowBlockers,
        });
        job.log(`Published run ${input.runId}.`);
        return { value: null, runId: input.runId };
      },
    );
    refresh(pool.sportSlug, pool.slug, true);
    return { ok: true, message: "Published.", lines: [] };
  } catch (error) {
    return failure(error);
  }
}

export async function unpublishRatingsWeek(input: {
  poolId: string;
  weekId: string;
}): Promise<RatingsActionResult> {
  await requireAdmin();
  const pool = await getPoolById(input.poolId);
  try {
    const count = await unpublishWeek(pool.id, input.weekId);
    refresh(pool.sportSlug, pool.slug, true);
    return {
      ok: true,
      message:
        count > 0 ? "Taken off the public site." : "Nothing was published.",
      lines: [],
    };
  } catch (error) {
    return failure(error);
  }
}

export async function previewRatingsRun(runId: string) {
  await requireAdmin();
  return runDiff(runId);
}

export async function findUnmappedTeams(input: {
  poolId: string;
  year: number;
}) {
  await requireAdmin();
  const pool = await getPoolById(input.poolId);
  return unmappedTeams(pool, input.year);
}

export async function findSchools(query: string) {
  await requireAdmin();
  if (query.trim().length < 2) return [];
  return searchSchools(query.trim());
}

export async function mapTeamToSchool(input: {
  externalId: string;
  schoolId: string;
}): Promise<RatingsActionResult> {
  await requireAdmin();
  try {
    await mapExternalId({
      provider: "espn",
      externalId: input.externalId,
      schoolId: input.schoolId,
    });
    revalidatePath("/ratings");
    return {
      ok: true,
      message: "Mapped. Sync the season again so its games pick up the school.",
      lines: [],
    };
  } catch (error) {
    const duplicate =
      (error as { cause?: { code?: string } })?.cause?.code === "23505";
    return failure(
      duplicate
        ? new Error("That ESPN team or that school already has an ESPN id.")
        : error,
    );
  }
}

/** Turn the cron (isActive) or the public pages (isPublic) on or off for a pool. */
export async function setRatingsPoolFlags(input: {
  poolId: string;
  isActive?: boolean;
  isPublic?: boolean;
}): Promise<RatingsActionResult> {
  await requireAdmin();
  const pool = await getPoolById(input.poolId);
  try {
    await setPoolFlags(pool.id, {
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
      ...(input.isPublic === undefined ? {} : { isPublic: input.isPublic }),
    });
    refresh(pool.sportSlug, pool.slug, input.isPublic !== undefined);
    const message =
      input.isPublic !== undefined
        ? input.isPublic
          ? "Ratings pages are now public."
          : "Ratings pages are hidden from the public."
        : input.isActive
          ? "The cron will sync and publish this pool."
          : "The cron will skip this pool.";
    return { ok: true, message, lines: [] };
  } catch (error) {
    return failure(error);
  }
}
