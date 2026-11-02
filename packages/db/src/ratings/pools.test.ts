import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { engineConfigSchema } from "./engine/config";
import { dedupeKey } from "./jobs/dedupe";
import { latestPlayedWeek, weekIsFrozen, weekStatus } from "./jobs/week-status";
import { poolScheduleSchema, scheduleIsOpen } from "./pools";

const repoRoot = path.resolve(__dirname, "../../../..");
const migration = fs.readFileSync(
  path.join(repoRoot, "apps/web/supabase/migrations/0024_rating_pools.sql"),
  "utf8",
);
const validation = JSON.parse(
  fs.readFileSync(
    path.join(
      repoRoot,
      "apps/web/content/ratings-validation/football-fcs.json",
    ),
    "utf8",
  ),
);

function seededJson(key: string): unknown {
  const match = migration.match(new RegExp(`'(\\{"${key}".*?\\})'::jsonb`));
  if (!match?.[1]) throw new Error(`No seeded ${key} JSON in migration.`);
  return JSON.parse(match[1]);
}

describe("FCS pool seed", () => {
  it("ships the calibrated config from the validation report", () => {
    const config = engineConfigSchema.parse(seededJson("marginTransform"));
    expect(config).toEqual(validation.config);
  });

  it("has a valid schedule", () => {
    expect(() => poolScheduleSchema.parse(seededJson("cadence"))).not.toThrow();
  });
});

describe("cron windows", () => {
  const schedule = poolScheduleSchema.parse(seededJson("cadence"));

  it("is open from Saturday 16:00 UTC through Sunday noon UTC", () => {
    expect(scheduleIsOpen(schedule, new Date("2026-10-31T15:59:00Z"))).toBe(
      false,
    );
    expect(scheduleIsOpen(schedule, new Date("2026-10-31T16:00:00Z"))).toBe(
      true,
    );
    expect(scheduleIsOpen(schedule, new Date("2026-11-01T06:30:00Z"))).toBe(
      true,
    );
    expect(scheduleIsOpen(schedule, new Date("2026-11-01T11:59:00Z"))).toBe(
      true,
    );
    expect(scheduleIsOpen(schedule, new Date("2026-11-01T12:00:00Z"))).toBe(
      false,
    );
  });

  it("is open Monday 22:00 through Tuesday 08:00 UTC, for Monday games like Labor Day", () => {
    expect(scheduleIsOpen(schedule, new Date("2026-11-02T21:59:00Z"))).toBe(
      false,
    );
    expect(scheduleIsOpen(schedule, new Date("2026-11-02T22:00:00Z"))).toBe(
      true,
    );
    expect(scheduleIsOpen(schedule, new Date("2026-11-03T07:30:00Z"))).toBe(
      true,
    );
    expect(scheduleIsOpen(schedule, new Date("2026-11-03T08:00:00Z"))).toBe(
      false,
    );
  });

  it("is closed the rest of the week", () => {
    expect(scheduleIsOpen(schedule, new Date("2026-11-02T15:00:00Z"))).toBe(
      false,
    );
    expect(scheduleIsOpen(schedule, new Date("2026-11-03T15:30:00Z"))).toBe(
      false,
    );
    expect(scheduleIsOpen(schedule, new Date("2026-11-04T15:30:00Z"))).toBe(
      false,
    );
  });

  it("freezes a week 10 hours after its last kickoff", () => {
    expect(schedule.freezeAfterHours).toBe(10);
  });
});

describe("weekend completeness", () => {
  const now = new Date("2026-11-01T05:00:00Z");
  const at = (iso: string) => new Date(iso);

  it("is complete when every game is over", () => {
    const status = weekStatus(
      [
        { status: "final", kickoffAt: at("2026-10-31T17:00:00Z") },
        { status: "final", kickoffAt: at("2026-11-01T01:00:00Z") },
        { status: "cancelled", kickoffAt: at("2026-10-31T19:00:00Z") },
      ],
      now,
    );
    expect(status.complete).toBe(true);
    expect(status.final).toBe(2);
  });

  it("waits for a Monday night game, and is complete once it ends", () => {
    const saturday = { status: "final", kickoffAt: at("2026-10-31T17:00:00Z") };
    const monday = at("2026-11-03T00:30:00Z");
    expect(
      weekStatus([saturday, { status: "scheduled", kickoffAt: monday }], now)
        .complete,
    ).toBe(false);
    const after = weekStatus(
      [saturday, { status: "final", kickoffAt: monday }],
      at("2026-11-03T04:00:00Z"),
    );
    expect(after.complete).toBe(true);
    expect(after.latestKickoff).toEqual(monday);
  });

  it("doesn't wait for a game rescheduled to later in the week", () => {
    expect(
      weekStatus(
        [
          { status: "final", kickoffAt: at("2026-10-31T17:00:00Z") },
          { status: "scheduled", kickoffAt: at("2026-11-04T23:00:00Z") },
        ],
        now,
      ).complete,
    ).toBe(true);
  });

  it("waits for a live game", () => {
    expect(
      weekStatus(
        [{ status: "in_progress", kickoffAt: at("2026-11-01T03:00:00Z") }],
        now,
      ).complete,
    ).toBe(false);
  });

  it("waits for a game later today", () => {
    expect(
      weekStatus(
        [
          { status: "final", kickoffAt: at("2026-10-31T17:00:00Z") },
          { status: "scheduled", kickoffAt: at("2026-11-01T18:00:00Z") },
        ],
        now,
      ).complete,
    ).toBe(false);
  });

  it("waits for a game whose kickoff has passed but is not yet marked final", () => {
    expect(
      weekStatus(
        [{ status: "scheduled", kickoffAt: at("2026-11-01T02:00:00Z") }],
        now,
      ).complete,
    ).toBe(false);
  });

  it("is not complete before any game is played, however far off they are", () => {
    expect(
      weekStatus(
        [{ status: "scheduled", kickoffAt: at("2026-11-07T19:00:00Z") }],
        now,
      ).complete,
    ).toBe(false);
  });

  it("picks the latest week that has games played", () => {
    const played = weekStatus(
      [{ status: "final", kickoffAt: at("2026-10-31T17:00:00Z") }],
      now,
    );
    const upcoming = weekStatus(
      [{ status: "scheduled", kickoffAt: at("2026-11-07T19:00:00Z") }],
      now,
    );
    expect(
      latestPlayedWeek([
        { week: 8, status: played },
        { week: 9, status: played },
        { week: 10, status: upcoming },
      ])?.week,
    ).toBe(9);
    expect(latestPlayedWeek([{ week: 10, status: upcoming }])).toBeNull();
  });

  it("is never complete with no games", () => {
    expect(weekStatus([], now).complete).toBe(false);
  });
});

describe("week freeze", () => {
  const status = weekStatus(
    [{ status: "final", kickoffAt: new Date("2026-11-01T02:00:00Z") }],
    new Date("2026-11-01T06:00:00Z"),
  );

  it("lets corrections republish until 10 hours after the last kickoff", () => {
    expect(
      weekIsFrozen(status, true, 10, new Date("2026-11-01T11:59:00Z")),
    ).toBe(false);
    expect(
      weekIsFrozen(status, true, 10, new Date("2026-11-01T12:00:00Z")),
    ).toBe(true);
  });

  it("never freezes a week that hasn't been published", () => {
    expect(
      weekIsFrozen(status, false, 10, new Date("2026-11-03T00:00:00Z")),
    ).toBe(false);
  });

  it("can't freeze a week with nothing kicked off", () => {
    const empty = weekStatus([], new Date("2026-11-01T06:00:00Z"));
    expect(
      weekIsFrozen(empty, true, 10, new Date("2026-11-03T00:00:00Z")),
    ).toBe(false);
  });
});

describe("dedupe key", () => {
  it("matches the same game from ESPN and NCAA regardless of side order", () => {
    const espn = dedupeKey(
      "2025-10-30T23:00:00Z",
      { schoolId: "del-st", name: "Delaware State Hornets" },
      { schoolId: "norfolk", name: "Norfolk State Spartans" },
    );
    const ncaa = dedupeKey(
      "2025-10-30T23:30:00Z",
      { schoolId: "norfolk", name: "Norfolk State University" },
      { schoolId: "del-st", name: "Delaware State University" },
    );
    expect(ncaa).toBe(espn);
  });

  it("uses the US Eastern date, so a late kickoff stays on its own day", () => {
    const key = dedupeKey(
      "2025-11-02T03:30:00Z",
      { schoolId: "a", name: "A" },
      { schoolId: null, name: "Some D-II School" },
    );
    expect(key).toBe("2025-11-01|a|name:some-d-ii-school");
  });
});

describe("week URL segments", () => {
  it("uses the bare week number, like rankings URLs, and 'postseason'", async () => {
    const { parseRatingWeekSegment, ratingWeekSegment } = await import(
      "./segments"
    );
    expect(ratingWeekSegment(2, 8)).toBe("8");
    expect(ratingWeekSegment(3, 1)).toBe("postseason");
    expect(parseRatingWeekSegment("8")).toEqual({ seasonType: 2, number: 8 });
    expect(parseRatingWeekSegment("postseason")).toEqual({
      seasonType: 3,
      number: 1,
    });
    for (const bad of ["week-8", "0", "08", "123", "eight"]) {
      expect(parseRatingWeekSegment(bad)).toBeNull();
    }
  });
});

/** Does a 5-field cron expression fire at this UTC minute? Supports *, a-b, lists, and step. */
function cronFires(expression: string, at: Date): boolean {
  const [minute, hour, day, month, weekday] = expression.split(" ");
  const matches = (field: string | undefined, value: number) =>
    (field ?? "*").split(",").some((part) => {
      const [range, step] = part.split("/");
      const [low, high] =
        range === "*"
          ? [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY]
          : (range ?? "").split("-").map(Number);
      const lo = low ?? 0;
      const hi = high ?? lo;
      if (value < lo || value > hi) return false;
      return step
        ? (value - (Number.isFinite(lo) ? lo : 0)) % Number(step) === 0
        : true;
    });
  return (
    matches(minute, at.getUTCMinutes()) &&
    matches(hour, at.getUTCHours()) &&
    matches(day, at.getUTCDate()) &&
    matches(month, at.getUTCMonth() + 1) &&
    matches(weekday, at.getUTCDay())
  );
}

describe("vercel.json cron schedule", () => {
  const crons = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "apps/web/vercel.json"), "utf8"),
  ).crons as Array<{ path: string; schedule: string }>;
  const schedule = poolScheduleSchema.parse(seededJson("cadence"));
  // Every 30-minute slot of one week, starting Sunday 2026-11-01 00:00 UTC.
  const slots = Array.from(
    { length: 7 * 48 },
    (_, i) => new Date(Date.UTC(2026, 10, 1) + i * 30 * 60 * 1000),
  );
  const fires = (at: Date) =>
    crons.some(
      (cron) =>
        cron.path === "/api/cron/ratings" && cronFires(cron.schedule, at),
    );

  it("fires in every slot where the FCS pool's window is open", () => {
    const missed = slots.filter(
      (at) => scheduleIsOpen(schedule, at) && !fires(at),
    );
    expect(missed.map((at) => at.toISOString())).toEqual([]);
  });

  it("never fires when no pool would act", () => {
    const wasted = slots.filter(
      (at) => fires(at) && !scheduleIsOpen(schedule, at),
    );
    expect(wasted.map((at) => at.toISOString())).toEqual([]);
  });

  it("is 60 calls a week", () => {
    expect(slots.filter(fires)).toHaveLength(60);
  });
});
