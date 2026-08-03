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
});
