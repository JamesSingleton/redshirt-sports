import { describe, expect, it } from "vitest";

import {
  globalRankingsNavHref,
  globalRankingsNavIsMultiSport,
  sportHasRankingsNav,
} from "@/lib/sport-nav";

const footballOnly = [
  { sport: "football", divisions: [{ division: "fcs", week: 1, year: 2026 }] },
  { sport: "mens-basketball", divisions: [] },
] as const;

describe("sport nav rankings helpers", () => {
  it("sportHasRankingsNav is true only when a poll week exists", () => {
    expect(sportHasRankingsNav(footballOnly, "football")).toBe(true);
    expect(sportHasRankingsNav(footballOnly, "mens-basketball")).toBe(false);
  });

  it("globalRankingsNavHref prefers football", () => {
    const both = [
      footballOnly[0],
      {
        sport: "mens-basketball",
        divisions: [{ division: "d1", week: 5, year: 2026 }],
      },
    ];
    expect(globalRankingsNavHref(both)).toBe("/college/football/rankings");
    expect(globalRankingsNavIsMultiSport(both)).toBe(true);
  });
});
