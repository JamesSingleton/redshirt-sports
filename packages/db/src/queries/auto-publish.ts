import { and, count, eq, inArray } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  ballotsTable,
  pollRankingsTable,
  pollsTable,
  SEASON_TYPE_CODES,
  sportsTable,
} from "../schema";
import {
  LEGACY_FINAL_RANKINGS_WEEK,
  LEGACY_PRESEASON_WEEK,
  weekTitle,
} from "../utils/week-mapping";
import { publishPollRankingsForWeek } from "./publish-rankings";
import { getVotingSeasonInfoBySportIds } from "./seasons";
import type { SportParam } from "./sports";

export const AUTO_PUBLISH_TIME_ZONE = "America/Chicago";
export const AUTO_PUBLISH_HOUR = 9;

/**
 * True from 9 AM Central on a Monday. Vercel Cron runs in UTC, so the route
 * fires at 14:00 and 15:00 UTC: one of them is 9 AM whether Chicago is on
 * CDT or CST, and the other is a no-op (too early, or already published).
 */
export function isAutoPublishTime(date: Date): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: AUTO_PUBLISH_TIME_ZONE,
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  return weekday === "Mon" && hour >= AUTO_PUBLISH_HOUR;
}

function chicagoParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: AUTO_PUBLISH_TIME_ZONE,
    weekday: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return {
    weekday: get("weekday"),
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
  };
}

/**
 * The next Monday 9 AM Central after `date`: when the cron will next publish.
 * 9 AM Central is 14:00 UTC on CDT and 15:00 UTC on CST, on the same date.
 */
export function nextAutoPublishAt(date: Date): Date {
  for (let offset = 0; offset <= 7; offset++) {
    const day = chicagoParts(new Date(date.getTime() + offset * 86_400_000));
    if (day.weekday !== "Mon") continue;
    for (const utcHour of [14, 15]) {
      const candidate = new Date(
        Date.UTC(day.year, day.month - 1, day.day, utcHour),
      );
      if (
        chicagoParts(candidate).hour === AUTO_PUBLISH_HOUR &&
        candidate.getTime() > date.getTime()
      ) {
        return candidate;
      }
    }
  }
  // Unreachable: some Monday 9 AM falls within the next eight days.
  throw new Error("No Monday 9 AM Central in the next week");
}

export type AutoPublishSchedule = {
  /** When the cron next runs (whether or not this poll will publish then). */
  runAt: Date;
  /** The voting week at runAt, e.g. "Week 10". */
  weekLabel: string | null;
  /**
   * "no-ballots": that week is open for voting now and has none yet, so the
   * run will skip it unless some come in. Before the week opens (say, the
   * Thursday before), zero ballots is normal and it stays "scheduled".
   */
  status:
    | "scheduled"
    | "no-ballots"
    | "off"
    | "manual"
    | "published"
    | "no-week";
};

/**
 * What the next auto-publish run will do for each poll: publish its voting
 * week then, or why not. Same rules as autoPublishDueRankings, read ahead.
 */
export async function listAutoPublishSchedule(
  date = new Date(),
): Promise<Map<string, AutoPublishSchedule>> {
  const runAt = nextAutoPublishAt(date);
  const polls = await db
    .select({
      id: pollsTable.id,
      sportId: pollsTable.sportId,
      isActive: pollsTable.isActive,
      autoPublish: pollsTable.autoPublish,
    })
    .from(pollsTable);
  const schedule = new Map<string, AutoPublishSchedule>();
  if (polls.length === 0) return schedule;

  const sportIds = [...new Set(polls.map((poll) => poll.sportId))];
  const [seasonBySportId, currentBySportId] = await Promise.all([
    getVotingSeasonInfoBySportIds(sportIds, runAt),
    getVotingSeasonInfoBySportIds(sportIds, date),
  ]);
  const weekIds = [
    ...new Set(
      [...seasonBySportId.values()].flatMap((season) =>
        season.weekId ? [season.weekId] : [],
      ),
    ),
  ];
  const published =
    weekIds.length === 0
      ? []
      : await db
          .selectDistinct({
            pollId: pollRankingsTable.pollId,
            weekId: pollRankingsTable.weekId,
          })
          .from(pollRankingsTable)
          .where(inArray(pollRankingsTable.weekId, weekIds));
  const publishedKeys = new Set(
    published.map((row) => `${row.pollId}:${row.weekId}`),
  );
  const ballotRows =
    weekIds.length === 0
      ? []
      : await db
          .selectDistinct({
            pollId: ballotsTable.pollId,
            weekId: ballotsTable.weekId,
          })
          .from(ballotsTable)
          .where(inArray(ballotsTable.weekId, weekIds));
  const hasBallots = new Set(
    ballotRows.map((row) => `${row.pollId}:${row.weekId}`),
  );

  for (const poll of polls) {
    const season = seasonBySportId.get(poll.sportId);
    const weekLabel = season ? weekTitle(season.votingWeek) : null;
    let status: AutoPublishSchedule["status"] = "scheduled";
    if (!poll.isActive || !poll.autoPublish) status = "off";
    else if (!season?.weekId) status = "no-week";
    else if (
      season.votingWeek === LEGACY_PRESEASON_WEEK ||
      season.votingWeek === LEGACY_FINAL_RANKINGS_WEEK
    )
      status = "manual";
    else if (publishedKeys.has(`${poll.id}:${season.weekId}`))
      status = "published";
    else if (
      currentBySportId.get(poll.sportId)?.weekId === season.weekId &&
      !hasBallots.has(`${poll.id}:${season.weekId}`)
    )
      status = "no-ballots";
    schedule.set(poll.id, { runAt, weekLabel, status });
  }
  return schedule;
}

type AutoPublishPoll = {
  poll: string;
  sportSlug: string;
  division: string;
};

export type AutoPublishResult =
  | (AutoPublishPoll & {
      status: "published";
      year: number;
      week: number;
      ballots: number;
      missed: number;
      lockedOutUserIds: string[];
      rankedSchoolSanityIds: string[];
    })
  | (AutoPublishPoll & {
      status: "skipped" | "failed";
      year: number | null;
      week: number | null;
      reason: string;
    });

/**
 * Publish each auto-publish poll's current voting week, once. Only regular
 * season weeks: Preseason and Final Rankings stay manual, and so does any poll
 * with auto-publish off (turn it off when a poll stops before its sport does,
 * like FCS at the playoffs). A week that already has rankings or no ballots is
 * skipped, so running twice is safe.
 */
export async function autoPublishDueRankings(
  date = new Date(),
): Promise<AutoPublishResult[]> {
  const polls = await db
    .select({
      id: pollsTable.id,
      name: pollsTable.name,
      slug: pollsTable.slug,
      sportId: pollsTable.sportId,
      sportSlug: sportsTable.slug,
    })
    .from(pollsTable)
    .innerJoin(sportsTable, eq(pollsTable.sportId, sportsTable.id))
    .where(
      and(eq(pollsTable.isActive, true), eq(pollsTable.autoPublish, true)),
    );
  if (polls.length === 0) return [];

  const seasonBySportId = await getVotingSeasonInfoBySportIds(
    [...new Set(polls.map((poll) => poll.sportId))],
    date,
  );

  const results: AutoPublishResult[] = [];
  for (const poll of polls) {
    const season = seasonBySportId.get(poll.sportId);
    const base = {
      poll: poll.name,
      sportSlug: poll.sportSlug,
      division: poll.slug,
      year: season?.year ?? null,
      week: season?.votingWeek ?? null,
    };
    if (!season?.weekId) {
      results.push({ ...base, status: "skipped", reason: "No voting week" });
      continue;
    }
    if (
      season.votingWeek === LEGACY_PRESEASON_WEEK ||
      season.votingWeek === LEGACY_FINAL_RANKINGS_WEEK
    ) {
      results.push({
        ...base,
        status: "skipped",
        reason: "Preseason and Final Rankings publish manually",
      });
      continue;
    }

    const [[published], [ballots]] = await Promise.all([
      db
        .select({ value: count() })
        .from(pollRankingsTable)
        .where(
          and(
            eq(pollRankingsTable.pollId, poll.id),
            eq(pollRankingsTable.weekId, season.weekId),
          ),
        ),
      db
        .select({ value: count() })
        .from(ballotsTable)
        .where(
          and(
            eq(ballotsTable.pollId, poll.id),
            eq(ballotsTable.weekId, season.weekId),
          ),
        ),
    ]);
    if ((published?.value ?? 0) > 0) {
      results.push({ ...base, status: "skipped", reason: "Already published" });
      continue;
    }
    if ((ballots?.value ?? 0) === 0) {
      results.push({ ...base, status: "skipped", reason: "No ballots" });
      continue;
    }

    try {
      const result = await publishPollRankingsForWeek({
        sport: poll.sportSlug as SportParam,
        division: poll.slug,
        year: season.year,
        seasonType: SEASON_TYPE_CODES.REGULAR_SEASON,
        weekNumber: season.votingWeek,
      });
      results.push({
        ...base,
        status: "published",
        year: season.year,
        week: season.votingWeek,
        ballots: result.ballots,
        missed: result.missed,
        lockedOutUserIds: result.lockedOutUserIds,
        rankedSchoolSanityIds: result.rankedSchoolSanityIds,
      });
    } catch (error) {
      results.push({
        ...base,
        status: "failed",
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return results;
}
