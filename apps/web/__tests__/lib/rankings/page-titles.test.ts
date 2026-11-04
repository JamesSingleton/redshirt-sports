import { describe, expect, it } from "vitest";

import { latestPollPageTitle } from "@/lib/rankings/page-titles";

describe("latestPollPageTitle", () => {
  it("includes the season and week", () => {
    expect(
      latestPollPageTitle({
        divisionName: "FCS",
        sportLabel: "College Football",
        year: 2026,
        titleWeek: "Week 9",
      }),
    ).toBe("FCS College Football Top 25 Rankings 2026: Week 9");
  });

  it("shortens the final poll label", () => {
    expect(
      latestPollPageTitle({
        divisionName: "FBS",
        sportLabel: "College Football",
        year: 2025,
        titleWeek: "Final Rankings",
      }),
    ).toBe("FBS College Football Top 25 Rankings 2025: Final");
  });

  it("drops the sport label when the title would pass 60 characters", () => {
    const title = latestPollPageTitle({
      divisionName: "Power Conferences",
      sportLabel: "Women's Basketball",
      year: 2026,
      titleWeek: "Preseason",
    });
    expect(title).toBe("Power Conferences Top 25 Rankings 2026: Preseason");
    expect(title.length).toBeLessThanOrEqual(60);
  });
});
