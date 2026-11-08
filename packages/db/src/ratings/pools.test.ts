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

const trimMigration = fs.readFileSync(
  path.join(
    repoRoot,
    "apps/web/supabase/migrations/0027_ratings_schedule_trim.sql",
  ),
  "utf8",
);
function seededJson(key: string): unknown {
  const match = migration.match(new RegExp(`'(\\{"${key}".*?\\})'::jsonb`));
  if (!match?.[1]) throw new Error(`No seeded ${key} JSON in migration.`);
  return JSON.parse(match[1]);
}

/** The FCS pool's schedule: seeded in 0024, windows narrowed in 0027. */
function fcsSchedule() {
  const windows = trimMigration.match(/'(\[.*?\])'::jsonb/)?.[1];
  if (!windows) throw new Error("No windows JSON in 0027 migration.");
  return poolScheduleSchema.parse({
    ...(seededJson("cadence") as object),
    windows: JSON.parse(windows),
  });
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
  const schedule = fcsSchedule();
  const open = (iso: string) => scheduleIsOpen(schedule, new Date(iso));

  it("is open Sunday 07:00 through noon UTC, midnight Pacific to 6 a.m. Eastern in either DST offset", () => {
    expect(open("2026-11-01T06:59:00Z")).toBe(false);
    expect(open("2026-11-01T07:00:00Z")).toBe(true);
    expect(open("2026-11-01T11:59:00Z")).toBe(true);
    expect(open("2026-11-01T12:00:00Z")).toBe(false);
  });

  it("is open Tuesday 10:00 through noon UTC, for Monday games", () => {
    expect(open("2026-11-03T09:59:00Z")).toBe(false);
    expect(open("2026-11-03T10:00:00Z")).toBe(true);
    expect(open("2026-11-03T11:59:00Z")).toBe(true);
    expect(open("2026-11-03T12:00:00Z")).toBe(false);
  });

  it("is closed Saturday, Monday night, and the rest of the week", () => {
    expect(open("2026-10-31T20:00:00Z")).toBe(false);
    expect(open("2026-11-02T23:00:00Z")).toBe(false);
    expect(open("2026-11-03T03:00:00Z")).toBe(false);
    expect(open("2026-11-04T10:30:00Z")).toBe(false);
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

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** The wall-clock fields of `at` in an IANA time zone. */
function localFields(at: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      minute: "numeric",
      hour: "numeric",
      day: "numeric",
      month: "numeric",
      weekday: "short",
    })
      .formatToParts(at)
      .map((part) => [part.type, part.value]),
  );
  return {
    minute: Number(parts.minute),
    hour: Number(parts.hour),
    day: Number(parts.day),
    month: Number(parts.month),
    weekday: weekdays.indexOf(parts.weekday ?? ""),
  };
}

/**
 * Does a 5-field cron expression fire at this minute in `timeZone` (default UTC)?
 * Supports *, a-b, lists, and step.
 */
function cronFires(expression: string, at: Date, timeZone = "UTC"): boolean {
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
  const local = localFields(at, timeZone);
  return (
    matches(minute, local.minute) &&
    matches(hour, local.hour) &&
    matches(day, local.day) &&
    matches(month, local.month) &&
    matches(weekday, local.weekday)
  );
}

describe("vercel.json ratings schedules", () => {
  const ratings = Object.values(
    JSON.parse(
      fs.readFileSync(path.join(repoRoot, "apps/web/vercel.json"), "utf8"),
    ).schedules as Record<
      string,
      { path: string; schedule: string; timezone?: string }
    >,
  ).filter((entry) => entry.path === "/api/cron/ratings");
  const schedule = fcsSchedule();
  // Every hour of 2026, UTC. All three zones sit on whole-hour offsets.
  const hours = Array.from(
    { length: 365 * 24 },
    (_, i) => new Date(Date.UTC(2026, 0, 1) + i * 3_600_000),
  );
  const fires = hours.filter((at) =>
    ratings.some((entry) => cronFires(entry.schedule, at, entry.timezone)),
  );
  const firesBetween = (from: string, to: string) =>
    fires
      .filter((at) => at >= new Date(from) && at < new Date(to))
      .map((at) => at.toISOString());

  it("only fires inside the pool's windows, with room for 15 minutes of jitter", () => {
    const outside = fires.filter(
      (at) =>
        !scheduleIsOpen(schedule, at) ||
        !scheduleIsOpen(schedule, new Date(at.getTime() + 15 * 60_000)),
    );
    expect(outside.map((at) => at.toISOString())).toEqual([]);
  });

  it("fires midnight Pacific and 6 a.m. Eastern Sunday, and 6 a.m. Eastern Tuesday, under daylight time", () => {
    expect(
      firesBetween("2026-09-05T00:00:00Z", "2026-09-12T00:00:00Z"),
    ).toEqual([
      "2026-09-06T07:00:00.000Z",
      "2026-09-06T10:00:00.000Z",
      "2026-09-08T10:00:00.000Z",
    ]);
  });

  it("keeps the same local times under standard time", () => {
    expect(
      firesBetween("2026-11-07T00:00:00Z", "2026-11-14T00:00:00Z"),
    ).toEqual([
      "2026-11-08T08:00:00.000Z",
      "2026-11-08T11:00:00.000Z",
      "2026-11-10T11:00:00.000Z",
    ]);
  });

  it("runs through the January title game and skips the offseason", () => {
    expect(
      firesBetween("2026-01-01T00:00:00Z", "2026-02-01T00:00:00Z"),
    ).not.toEqual([]);
    expect(
      firesBetween("2026-02-01T00:00:00Z", "2026-08-01T00:00:00Z"),
    ).toEqual([]);
  });
});
