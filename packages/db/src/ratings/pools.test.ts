import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { engineConfigSchema } from "./engine/config";
import { dedupeKey } from "./jobs/dedupe";
import { latestPlayedWeek, weekStatus } from "./jobs/week-status";
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

  it("has Monday and Tuesday correction sweeps and is closed midweek", () => {
    expect(scheduleIsOpen(schedule, new Date("2026-11-02T15:30:00Z"))).toBe(
      true,
    );
    expect(scheduleIsOpen(schedule, new Date("2026-11-03T15:00:00Z"))).toBe(
      true,
    );
    expect(scheduleIsOpen(schedule, new Date("2026-11-04T15:30:00Z"))).toBe(
      false,
    );
  });
});

describe("weekend completeness", () => {
  const now = new Date("2026-11-01T05:00:00Z");
  const at = (iso: string) => new Date(iso);

  it("is complete when everything kicked off is over and nothing starts within a day", () => {
    const status = weekStatus(
      [
        { status: "final", kickoffAt: at("2026-10-31T17:00:00Z") },
        { status: "final", kickoffAt: at("2026-11-01T01:00:00Z") },
        { status: "cancelled", kickoffAt: at("2026-10-31T19:00:00Z") },
        // A Monday night game doesn't hold up Sunday's publish.
        { status: "scheduled", kickoffAt: at("2026-11-03T00:30:00Z") },
      ],
      now,
    );
    expect(status.complete).toBe(true);
    expect(status.final).toBe(2);
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
