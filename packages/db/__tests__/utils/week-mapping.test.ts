import { describe, expect, it } from "vitest";

import { SEASON_TYPE_CODES } from "../../src/schema";
import {
  calendarWeekKey,
  LEGACY_FINAL_RANKINGS_WEEK,
  LEGACY_PRESEASON_WEEK,
  legacyWeekLabel,
  legacyWeekToSeasonTypeAndNumber,
  parseCalendarWeekKey,
  resolveCalendarWeekParams,
  seasonTypeAndNumberToLegacyWeek,
  weekTitle,
} from "../../src/utils/week-mapping";

describe("legacyWeekToSeasonTypeAndNumber", () => {
  it("maps preseason 0 to season type 1 week 1", () => {
    expect(legacyWeekToSeasonTypeAndNumber(LEGACY_PRESEASON_WEEK)).toEqual({
      seasonType: SEASON_TYPE_CODES.PRESEASON,
      weekNumber: 1,
    });
  });

  it("maps final rankings 999 to postseason week 1", () => {
    expect(legacyWeekToSeasonTypeAndNumber(LEGACY_FINAL_RANKINGS_WEEK)).toEqual(
      {
        seasonType: SEASON_TYPE_CODES.POSTSEASON,
        weekNumber: 1,
      },
    );
  });

  it("maps regular season weeks 1–N to season type 2", () => {
    expect(legacyWeekToSeasonTypeAndNumber(5)).toEqual({
      seasonType: SEASON_TYPE_CODES.REGULAR_SEASON,
      weekNumber: 5,
    });
  });
});

describe("seasonTypeAndNumberToLegacyWeek", () => {
  it("round-trips with legacyWeekToSeasonTypeAndNumber", () => {
    for (const legacy of [0, 1, 12, 999]) {
      const { seasonType, weekNumber } =
        legacyWeekToSeasonTypeAndNumber(legacy);
      expect(seasonTypeAndNumberToLegacyWeek(seasonType, weekNumber)).toBe(
        legacy,
      );
    }
  });
});

describe("calendarWeekKey / parseCalendarWeekKey", () => {
  it("formats and parses seasonType-weekNumber keys", () => {
    expect(calendarWeekKey(2, 7)).toBe("2-7");
    expect(parseCalendarWeekKey("2-7")).toEqual({
      seasonType: 2,
      weekNumber: 7,
    });
  });

  it("rejects invalid keys", () => {
    expect(parseCalendarWeekKey("abc")).toBeNull();
    expect(parseCalendarWeekKey("2-0")).toBeNull();
    expect(parseCalendarWeekKey("2")).toBeNull();
  });
});

describe("resolveCalendarWeekParams", () => {
  it("prefers weekKey when provided", () => {
    expect(resolveCalendarWeekParams({ weekKey: "2-4" })).toEqual({
      seasonType: 2,
      weekNumber: 4,
    });
  });

  it("uses seasonType + weekNumber", () => {
    expect(resolveCalendarWeekParams({ seasonType: 1, weekNumber: 1 })).toEqual(
      { seasonType: 1, weekNumber: 1 },
    );
  });

  it("falls back to legacy week integers", () => {
    expect(resolveCalendarWeekParams({ legacyWeek: 0 })).toEqual({
      seasonType: 1,
      weekNumber: 1,
    });
    expect(resolveCalendarWeekParams({ legacyWeek: 999 })).toEqual({
      seasonType: 3,
      weekNumber: 1,
    });
  });

  it("throws when week cannot be resolved", () => {
    expect(() => resolveCalendarWeekParams({})).toThrow(/Week is required/);
    expect(() => resolveCalendarWeekParams({ weekKey: "bad" })).toThrow(
      /Invalid week key/,
    );
  });
});

describe("weekTitle / legacyWeekLabel", () => {
  it("labels legacy weeks for URLs", () => {
    expect(weekTitle(0)).toBe("Preseason");
    expect(weekTitle(999)).toBe("Final Rankings");
    expect(weekTitle(3)).toBe("Week 3");
  });

  it("prefers ESPN text for regular season when present", () => {
    expect(
      legacyWeekLabel({
        legacyWeek: 3,
        seasonType: SEASON_TYPE_CODES.REGULAR_SEASON,
        weekNumber: 3,
        text: "Week 3",
      }),
    ).toBe("Week 3");
  });

  it("always labels preseason as Preseason", () => {
    expect(
      legacyWeekLabel({
        legacyWeek: 0,
        seasonType: SEASON_TYPE_CODES.PRESEASON,
        weekNumber: 1,
        text: "Week 1",
      }),
    ).toBe("Preseason");
  });
});
