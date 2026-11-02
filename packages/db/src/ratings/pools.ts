import { z } from "zod";

import { engineConfigSchema } from "./engine/config";

/**
 * Who belongs to a pool in a season.
 * - espn_group: ESPN's own grouping (FCS = 81, FBS = 80).
 * - division_conferences: members of conferences mapped to the pool's Redshirt division
 *   (mid-major basketball), via school_conference_affiliations.
 */
export const poolMembershipSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("espn_group"), groupId: z.string() }),
  z.object({ type: z.literal("division_conferences") }),
]);

/** Where games come from. */
export const poolSourceSchema = z.object({
  /** ESPN path segment, e.g. "football/college-football". */
  espnLeague: z.string(),
  /** ESPN scoreboard `groups` filter; covers every game involving a pool team. */
  scoreboardGroups: z.string(),
  /** Regulation periods; more means overtime (4 quarters, 2 halves). */
  regulationPeriods: z.number().int().positive(),
  /** NCAA scoreboard path for the fallback, e.g. "football/fcs". Null disables it. */
  ncaaPath: z.string().nullable(),
  /**
   * ESPN groups that name a team's level, e.g. { FBS: "80", FCS: "81", DII: "57", DIII: "58" }.
   * Used to label games that don't count: "Arizona (FBS)". Teams in none of them are "Other".
   */
  levelGroups: z.record(z.string(), z.string()).default({}),
});

const windowSchema = z.object({
  /** UTC day of week, 0 = Sunday. */
  day: z.number().int().min(0).max(6),
  startHour: z.number().int().min(0).max(23),
  /** Exclusive; may exceed 24 to run past midnight into the next day. */
  endHour: z.number().int().min(1).max(48),
});

/**
 * When the cron looks at a pool, in UTC. "weekly" publishes one run per week once
 * the week's games are done; "daily" refreshes the current week's run nightly.
 */
export const poolScheduleSchema = z.object({
  cadence: z.enum(["weekly", "daily"]),
  windows: z.array(windowSchema),
});

export type PoolMembership = z.infer<typeof poolMembershipSchema>;
export type PoolSource = z.infer<typeof poolSourceSchema>;
export type PoolSchedule = z.infer<typeof poolScheduleSchema>;

export const poolDefinitionSchema = z.object({
  membership: poolMembershipSchema,
  source: poolSourceSchema,
  schedule: poolScheduleSchema,
  config: engineConfigSchema,
});

export type PoolDefinition = z.infer<typeof poolDefinitionSchema>;

/** Is `now` inside one of the pool's cron windows? */
export function scheduleIsOpen(schedule: PoolSchedule, now: Date): boolean {
  const day = now.getUTCDay();
  const hour = now.getUTCHours() + now.getUTCMinutes() / 60;
  return schedule.windows.some((window) => {
    if (
      day === window.day &&
      hour >= window.startHour &&
      hour < window.endHour
    ) {
      return true;
    }
    // A window that runs past midnight continues on the next day.
    const nextDay = (window.day + 1) % 7;
    return day === nextDay && window.endHour > 24 && hour < window.endHour - 24;
  });
}
