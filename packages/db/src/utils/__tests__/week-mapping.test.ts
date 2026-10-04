import { describe, expect, it } from "vitest";

import { SEASON_TYPE_CODES } from "../../schema";
import { pollThroughDate } from "../week-mapping";

describe("pollThroughDate", () => {
  it.each([
    ["2026-09-28T06:59:00Z", "2026-09-26", "a week ending Sunday (PDT)"],
    ["2025-11-24T07:59:00Z", "2025-11-22", "a week ending Sunday (PST)"],
    ["2026-09-08T06:59:00Z", "2026-09-07", "Labor Day week ending Monday"],
  ])("%s covers games through %s for %s", (endDate, expected) => {
    expect(
      pollThroughDate(new Date(endDate), SEASON_TYPE_CODES.REGULAR_SEASON),
    ).toBe(expected);
  });

  it("returns null for preseason and postseason polls", () => {
    const endDate = new Date("2026-08-22T06:59:00Z");
    expect(pollThroughDate(endDate, SEASON_TYPE_CODES.PRESEASON)).toBeNull();
    expect(pollThroughDate(endDate, SEASON_TYPE_CODES.POSTSEASON)).toBeNull();
  });
});
