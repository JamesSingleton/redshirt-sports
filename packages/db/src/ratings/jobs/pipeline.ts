import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";

import { primaryDb as db } from "../../client";
import { gamesTable, ratingRunsTable } from "../../schema";
import { scheduleIsOpen } from "../pools";
import { computeRun } from "./compute";
import {
  type JobTrigger,
  type PublishBlocker,
  publishRun,
  withJob,
} from "./lifecycle";
import { resolveMembership, saveMembership } from "./membership";
import {
  type CalendarWeek,
  loadSeasonCalendar,
  type Pool,
  type SeasonCalendar,
  seasonYearAt,
  weekAt,
} from "./store";
import { loadTeamLevels, relinkGames, syncWeek } from "./sync";
import { latestPlayedWeek, weekStatus } from "./week-status";

export {
  latestPlayedWeek,
  type WeekStatus,
  weekStatus,
} from "./week-status";

export async function loadWeekGames(
  calendar: SeasonCalendar,
  week: CalendarWeek,
  memberIds: string[],
) {
  if (memberIds.length === 0) return [];
  return db
    .select({ status: gamesTable.status, kickoffAt: gamesTable.kickoffAt })
    .from(gamesTable)
    .where(
      and(
        eq(gamesTable.seasonId, calendar.seasonId),
        eq(gamesTable.weekId, week.id),
        or(
          inArray(gamesTable.homeSchoolId, memberIds),
          inArray(gamesTable.awaySchoolId, memberIds),
        ),
      ),
    );
}

/** Pool members ESPN lists that have no Redshirt school, with how many stored games they played. */
async function unmappedMembers(
  calendar: SeasonCalendar,
  externalIds: string[],
): Promise<PublishBlocker[]> {
  if (externalIds.length === 0) return [];
  const rows = await db
    .select({
      homeExternalId: gamesTable.homeExternalId,
      awayExternalId: gamesTable.awayExternalId,
      homeName: gamesTable.homeName,
      awayName: gamesTable.awayName,
      homeSchoolId: gamesTable.homeSchoolId,
      awaySchoolId: gamesTable.awaySchoolId,
    })
    .from(gamesTable)
    .where(
      and(
        eq(gamesTable.seasonId, calendar.seasonId),
        eq(gamesTable.status, "final"),
        or(
          and(
            isNull(gamesTable.homeSchoolId),
            inArray(gamesTable.homeExternalId, externalIds),
          ),
          and(
            isNull(gamesTable.awaySchoolId),
            inArray(gamesTable.awayExternalId, externalIds),
          ),
        ),
      ),
    );
  const byId = new Map<string, PublishBlocker>(
    externalIds.map((id) => [
      id,
      { externalId: id, name: `ESPN team ${id}`, games: 0 },
    ]),
  );
  for (const row of rows) {
    for (const [id, name, school] of [
      [row.homeExternalId, row.homeName, row.homeSchoolId],
      [row.awayExternalId, row.awayName, row.awaySchoolId],
    ] as const) {
      const entry = id && !school ? byId.get(id) : undefined;
      if (entry) {
        entry.games += 1;
        entry.name = name;
      }
    }
  }
  return [...byId.values()];
}

/** Sync membership and a set of weeks; shared by the pipeline, admin, and the CLI. */
export async function syncPoolWeeks(input: {
  pool: Pool;
  calendar: SeasonCalendar;
  weeks: CalendarWeek[];
  now: Date;
  log: (line: string) => void;
  /** Only the week in progress may fall back to the NCAA feed. */
  fallbackWeekId?: string | null;
}): Promise<{ memberIds: string[]; blockers: PublishBlocker[] }> {
  const { pool, calendar, now, log } = input;
  const membership = await resolveMembership(pool, calendar);
  await saveMembership(pool, calendar, membership);
  log(
    `${calendar.year} ${pool.name}: ${membership.schoolIds.length} members` +
      (membership.unmappedExternalIds.length > 0
        ? `, ${membership.unmappedExternalIds.length} without a Redshirt school (${membership.unmappedExternalIds.join(", ")})`
        : ""),
  );
  const levels = await loadTeamLevels(pool, calendar.year);
  for (const week of input.weeks) {
    const result = await syncWeek({
      levels,
      pool,
      calendar,
      week,
      now,
      allowFallback: week.id === input.fallbackWeekId,
    });
    log(
      `${result.week}: ${result.games} games from ${result.source.toUpperCase()}` +
        (result.skipped
          ? `, ${result.skipped} unreadable events skipped`
          : "") +
        (result.note ? `. ${result.note}` : ""),
    );
  }
  await relinkGames(calendar.seasonId);
  const blockers = (
    await unmappedMembers(calendar, membership.unmappedExternalIds)
  ).filter((blocker) => blocker.games > 0);
  for (const blocker of blockers) {
    log(
      `Blocking publish: ${blocker.name} (ESPN ${blocker.externalId}) played ${blocker.games} game(s) but isn't mapped.`,
    );
  }
  return { memberIds: membership.schoolIds, blockers };
}

export type PipelineResult = {
  status:
    | "published"
    | "unchanged"
    | "waiting"
    | "outside_window"
    | "no_week"
    | "blocked";
  message: string;
  runId?: string;
  lines: string[];
};

/**
 * The weekend job. Sync this week (plus two back for stat corrections), and once
 * the weekend is complete, compute and publish. Safe to call as often as you like:
 * unchanged inputs and an already-published checksum are no-ops.
 */
export async function runPipeline(input: {
  pool: Pool;
  trigger: JobTrigger;
  now?: Date;
  actor?: string | null;
  /** Ignore the cron window (admin "Run now"). */
  ignoreSchedule?: boolean;
  /** Publish even if the weekend isn't complete (admin override). */
  ignoreCompleteness?: boolean;
}): Promise<PipelineResult> {
  const { pool } = input;
  const now = input.now ?? new Date();
  if (!input.ignoreSchedule && !scheduleIsOpen(pool.schedule, now)) {
    return {
      status: "outside_window",
      message: "Outside this pool's cron window.",
      lines: [],
    };
  }
  const year = await seasonYearAt(pool.sportId, now);
  if (year == null) {
    return { status: "no_week", message: "No season has started.", lines: [] };
  }
  const calendar = await loadSeasonCalendar(pool.sportId, year);
  const week = weekAt(calendar, now);
  if (!week) {
    return {
      status: "no_week",
      message: `No ${year} week is under way.`,
      lines: [],
    };
  }

  type Outcome = {
    status: PipelineResult["status"];
    message: string;
    runId?: string;
  };
  const { value, job } = await withJob<Outcome>(
    {
      poolId: pool.id,
      kind: "pipeline",
      trigger: input.trigger,
      actor: input.actor,
      request: {
        year,
        week: week.label,
        ignoreCompleteness: input.ignoreCompleteness ?? false,
      },
    },
    async (job) => {
      const position = calendar.weeks.indexOf(week);
      const weeks = calendar.weeks.slice(
        Math.max(0, position - 2),
        position + 1,
      );
      const { memberIds, blockers } = await syncPoolWeeks({
        pool,
        calendar,
        weeks,
        now,
        log: job.log,
        fallbackWeekId: week.id,
      });

      // Publish the latest week that has games played. On Monday ESPN's
      // calendar has already moved on, but the weekend just finished is still
      // the one to publish (with any stat corrections).
      const statuses = await Promise.all(
        weeks.map(async (candidate) => ({
          week: candidate,
          status: weekStatus(
            await loadWeekGames(calendar, candidate, memberIds),
            now,
          ),
        })),
      );
      const picked = latestPlayedWeek(statuses);
      if (!picked) {
        const message = `Waiting: no ${pool.name} games played yet in ${week.label}.`;
        job.log(message);
        return {
          value: { status: "waiting" as const, message },
          status: "skipped" as const,
        };
      }
      const { week: target, status } = picked;
      job.log(
        `${target.label}: ${status.final}/${status.total} final, ${status.inProgress} live, ${status.scheduled} scheduled.`,
      );
      if (!status.complete && !input.ignoreCompleteness) {
        const message = status.nextKickoff
          ? `Waiting: weekend not finished (next kickoff ${status.nextKickoff.toISOString()}).`
          : "Waiting: games still in progress.";
        job.log(message);
        return {
          value: { status: "waiting" as const, message },
          status: "skipped" as const,
        };
      }

      const outcome = await computeRun({
        pool,
        calendar,
        week: target,
        trigger: input.trigger,
      });
      const runId = outcome.runId;
      if (outcome.status === "computed") {
        await db
          .update(ratingRunsTable)
          .set({
            diagnostics: {
              ...outcome.result.diagnostics,
              unmappedMembers: blockers,
            },
          })
          .where(eq(ratingRunsTable.id, outcome.runId));
        job.log(
          `Computed run ${outcome.runId} (${outcome.result.diagnostics.poolGamesPlayed} pool games).`,
        );
      } else {
        job.log(`Compute skipped: ${outcome.reason}.`);
      }

      const [published] = await db
        .select({ id: ratingRunsTable.id })
        .from(ratingRunsTable)
        .where(
          and(
            eq(ratingRunsTable.poolId, pool.id),
            eq(ratingRunsTable.weekId, target.id),
            eq(ratingRunsTable.status, "published"),
          ),
        )
        .orderBy(desc(ratingRunsTable.publishedAt))
        .limit(1);
      if (published?.id === runId) {
        return {
          value: {
            status: "unchanged" as const,
            message: "Already published; nothing changed.",
            runId,
          },
          status: "skipped" as const,
          runId,
        };
      }
      if (blockers.length > 0) {
        const message = `Blocked: ${blockers.length} unmapped pool member(s) played games.`;
        return {
          value: { status: "blocked" as const, message, runId },
          status: "skipped" as const,
          runId,
        };
      }
      await publishRun(runId, input.actor ?? input.trigger);
      job.log(`Published ${target.label}.`);
      return {
        value: {
          status: "published" as const,
          message: `Published ${calendar.year} ${target.label}.`,
          runId,
        },
        runId,
      };
    },
  );
  return { ...value, lines: job.lines };
}
