import {
  formatWeekSegment,
  LEGACY_FINAL_RANKINGS_WEEK,
  LEGACY_PRESEASON_WEEK,
  parseWeekSegment,
  SportSchema,
  weekTitle,
} from "@/utils/espn";

describe("apps/web utils/espn re-exports", () => {
  it("re-exports SportSchema and week URL helpers from clients", () => {
    expect(SportSchema.parse("football")).toBe("football");
    expect(parseWeekSegment("final-rankings")).toBe(LEGACY_FINAL_RANKINGS_WEEK);
    expect(formatWeekSegment(LEGACY_FINAL_RANKINGS_WEEK)).toBe(
      "final-rankings",
    );
    expect(weekTitle(LEGACY_PRESEASON_WEEK)).toBe("Preseason");
  });

  it("round-trips preseason, regular, and final-rankings segments", () => {
    expect(parseWeekSegment("preseason")).toBe(LEGACY_PRESEASON_WEEK);
    expect(formatWeekSegment(LEGACY_PRESEASON_WEEK)).toBe("0");
    expect(weekTitle(LEGACY_PRESEASON_WEEK)).toBe("Preseason");

    expect(parseWeekSegment("5")).toBe(5);
    expect(formatWeekSegment(5)).toBe("5");
    expect(weekTitle(5)).toBe("Week 5");

    expect(parseWeekSegment("final-rankings")).toBe(LEGACY_FINAL_RANKINGS_WEEK);
    expect(formatWeekSegment(LEGACY_FINAL_RANKINGS_WEEK)).toBe(
      "final-rankings",
    );
    expect(weekTitle(LEGACY_FINAL_RANKINGS_WEEK)).toBe("Final Rankings");
  });
});
