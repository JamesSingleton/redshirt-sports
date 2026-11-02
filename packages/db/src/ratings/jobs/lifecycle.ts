import { and, eq, lt, sql } from "drizzle-orm";

import { primaryDb as db } from "../../client";
import { ratingJobsTable, ratingRunsTable } from "../../schema";

export type JobKind = "sync" | "compute" | "publish" | "pipeline";
export type JobTrigger = "cron" | "admin" | "cli";

export class JobBusyError extends Error {
  constructor() {
    super(
      "Another ratings job is already running for this pool. Try again in a few minutes.",
    );
    this.name = "JobBusyError";
  }
}

/** A job that has been "running" this long crashed or timed out. */
const STALE_AFTER_MS = 15 * 60 * 1000;

function isUniqueViolation(error: unknown): boolean {
  const cause = (error as { cause?: { code?: string } })?.cause;
  return (
    (error as { code?: string })?.code === "23505" || cause?.code === "23505"
  );
}

export type JobLog = {
  id: string;
  lines: string[];
  log: (line: string) => void;
};

/**
 * Run `work` as a logged job holding the pool's lock: a unique "running" row per pool,
 * which works across serverless instances and the transaction pooler.
 */
export async function withJob<T>(
  input: {
    poolId: string;
    kind: JobKind;
    trigger: JobTrigger;
    actor?: string | null;
    request?: unknown;
  },
  work: (job: JobLog) => Promise<{
    value: T;
    status?: "succeeded" | "skipped";
    runId?: string | null;
  }>,
): Promise<{ value: T; job: JobLog }> {
  await db
    .update(ratingJobsTable)
    .set({
      status: "failed",
      error: "Timed out (no finish recorded).",
      finishedAt: new Date(),
    })
    .where(
      and(
        eq(ratingJobsTable.poolId, input.poolId),
        eq(ratingJobsTable.status, "running"),
        lt(ratingJobsTable.startedAt, new Date(Date.now() - STALE_AFTER_MS)),
      ),
    );

  let jobId: string;
  try {
    const [row] = await db
      .insert(ratingJobsTable)
      .values({
        poolId: input.poolId,
        kind: input.kind,
        trigger: input.trigger,
        status: "running",
        actor: input.actor ?? null,
        request: input.request ?? null,
      })
      .returning({ id: ratingJobsTable.id });
    if (!row) throw new Error("Could not start job.");
    jobId = row.id;
  } catch (error) {
    if (isUniqueViolation(error)) throw new JobBusyError();
    throw error;
  }

  const lines: string[] = [];
  const job: JobLog = { id: jobId, lines, log: (line) => lines.push(line) };
  try {
    const outcome = await work(job);
    await db
      .update(ratingJobsTable)
      .set({
        status: outcome.status ?? "succeeded",
        lines,
        runId: outcome.runId ?? null,
        finishedAt: new Date(),
      })
      .where(eq(ratingJobsTable.id, jobId));
    return { value: outcome.value, job };
  } catch (error) {
    await db
      .update(ratingJobsTable)
      .set({
        status: "failed",
        lines,
        error: error instanceof Error ? error.message : String(error),
        finishedAt: new Date(),
      })
      .where(eq(ratingJobsTable.id, jobId));
    throw error;
  }
}

export type PublishBlocker = {
  externalId: string;
  name: string;
  games: number;
};

/** Make `runId` the published run for its week; the previous one becomes superseded. */
export async function publishRun(
  runId: string,
  actor: string | null,
  options: { allowBlockers?: boolean } = {},
): Promise<{ poolId: string; weekId: string }> {
  return db.transaction(async (tx) => {
    const [run] = await tx
      .select({
        id: ratingRunsTable.id,
        poolId: ratingRunsTable.poolId,
        weekId: ratingRunsTable.weekId,
        diagnostics: ratingRunsTable.diagnostics,
      })
      .from(ratingRunsTable)
      .where(eq(ratingRunsTable.id, runId))
      .for("update");
    if (!run) throw new Error(`No rating run ${runId}.`);
    const blockers = (
      (run.diagnostics as { unmappedMembers?: PublishBlocker[] })
        ?.unmappedMembers ?? []
    ).filter((blocker) => blocker.games > 0);
    if (blockers.length > 0 && !options.allowBlockers) {
      throw new Error(
        `Not published: ${blockers.length} pool member(s) with games have no Redshirt school (${blockers
          .map((b) => b.name)
          .join(
            ", ",
          )}). Map them under Ratings → Team mapping, then recompute.`,
      );
    }
    await tx
      .update(ratingRunsTable)
      .set({ status: "superseded", updatedAt: new Date() })
      .where(
        and(
          eq(ratingRunsTable.poolId, run.poolId),
          eq(ratingRunsTable.weekId, run.weekId),
          eq(ratingRunsTable.status, "published"),
        ),
      );
    await tx
      .update(ratingRunsTable)
      .set({
        status: "published",
        publishedAt: new Date(),
        publishedBy: actor,
        updatedAt: new Date(),
      })
      .where(eq(ratingRunsTable.id, run.id));
    return { poolId: run.poolId, weekId: run.weekId };
  });
}

/** Take a week off the public site. Its runs stay for history and can be republished. */
export async function unpublishWeek(
  poolId: string,
  weekId: string,
): Promise<number> {
  const result = await db
    .update(ratingRunsTable)
    .set({ status: "superseded", updatedAt: new Date() })
    .where(
      and(
        eq(ratingRunsTable.poolId, poolId),
        eq(ratingRunsTable.weekId, weekId),
        eq(ratingRunsTable.status, "published"),
      ),
    )
    .returning({ id: ratingRunsTable.id });
  return result.length;
}

/** Drop draft runs that were never published and are older than the latest run for their week. */
export async function pruneDrafts(
  poolId: string,
  keepPerWeek = 5,
): Promise<void> {
  await db.execute(sql`
    delete from rating_runs r
    using (
      select id, row_number() over (partition by week_id order by computed_at desc) as position
      from rating_runs
      where pool_id = ${poolId} and status = 'draft'
    ) ranked
    where r.id = ranked.id and ranked.position > ${keepPerWeek}
  `);
}
