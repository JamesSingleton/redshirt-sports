import { pollDateLabel } from "@/lib/poll-label";
import {
  LEGACY_FINAL_RANKINGS_WEEK,
  LEGACY_PRESEASON_WEEK,
} from "@/utils/espn";

describe("pollDateLabel", () => {
  it("labels regular-season polls by the last game day covered", () => {
    expect(
      pollDateLabel({ week: 4, year: 2026, throughDate: "2026-09-26" }),
    ).toBe("Through Games SEP. 26, 2026");
  });

  it("uses the calendar year of the games, not the season", () => {
    expect(
      pollDateLabel({ week: 13, year: 2025, throughDate: "2025-11-22" }),
    ).toBe("Through Games NOV. 22, 2025");
  });

  it("falls back to the season and week name without a through date", () => {
    expect(
      pollDateLabel({
        week: LEGACY_PRESEASON_WEEK,
        year: 2026,
        throughDate: null,
      }),
    ).toBe("2026 Preseason");
    expect(
      pollDateLabel({
        week: LEGACY_FINAL_RANKINGS_WEEK,
        year: 2025,
        throughDate: null,
      }),
    ).toBe("2025 Final Rankings");
  });
});
