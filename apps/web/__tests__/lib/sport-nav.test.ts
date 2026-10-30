import { describe, expect, it } from "vitest";

import {
  globalRankingsNavHref,
  globalRankingsNavIsMultiSport,
  navLatestPolls,
  pollNavLabel,
  sportHasRankingsNav,
  sportHubPath,
  sportNavLabel,
  sportRankingsIndexPath,
  sportSlugsWithRankingsNav,
} from "@/lib/sport-nav";

const footballOnly = [
  { sport: "football", divisions: [{ division: "fcs", week: 1, year: 2026 }] },
  { sport: "mens-basketball", divisions: [] },
] as const;

describe("sport nav rankings helpers", () => {
  it("formats labels and paths", () => {
    expect(sportNavLabel("football", "FB")).toBe("College Football");
    expect(sportNavLabel("other", "Other")).toBe("Other");
    expect(sportHubPath("football")).toBe("/college/football/news");
    expect(sportRankingsIndexPath("football")).toBe(
      "/college/football/rankings",
    );
  });

  it("sportHasRankingsNav is true only when a poll week exists", () => {
    expect(sportHasRankingsNav(footballOnly, "football")).toBe(true);
    expect(sportHasRankingsNav(footballOnly, "womens-basketball")).toBe(false);
    expect(sportHasRankingsNav(footballOnly, "mens-basketball")).toBe(false);
    expect(
      sportHasRankingsNav(
        [
          {
            sport: "football",
            divisions: [undefined, { division: "fbs", week: 1, year: 2026 }],
          },
        ],
        "football",
      ),
    ).toBe(true);
    expect(
      sportHasRankingsNav(
        [
          {
            sport: "football",
            divisions: [{ division: "fbs", week: null, year: 2026 }],
          },
        ] as never,
        "football",
      ),
    ).toBe(false);
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

  it("lists ranking sports and handles empty nav", () => {
    const duplicateFootball = [footballOnly[0], footballOnly[0]];
    expect(sportSlugsWithRankingsNav(duplicateFootball)).toEqual(["football"]);
    expect(
      sportHasRankingsNav(
        [{ sport: "football", divisions: undefined }] as never,
        "football",
      ),
    ).toBe(false);
    expect(sportSlugsWithRankingsNav(footballOnly)).toEqual(["football"]);
    expect(pollNavLabel("fcs")).toBe("FCS");
    expect(pollNavLabel("custom")).toBe("CUSTOM");
    expect(
      navLatestPolls([
        { division: "fbs", week: 8, year: 2026 },
        undefined,
        { division: "fcs", week: 8, year: 2026 },
        { division: "zzz", week: 1, year: 2026 },
        { division: "aaa", week: 2, year: 2026 },
        { division: "", week: 1, year: 2026 },
        { division: "d2", week: null as never, year: 2026 },
        { division: "d3", week: 1, year: null as never },
      ]).map((poll) => poll.division),
    ).toEqual(["fcs", "fbs", "zzz", "aaa"]);
    expect(globalRankingsNavHref([])).toBeNull();
    expect(
      globalRankingsNavHref([
        {
          sport: "mens-basketball",
          divisions: [{ division: "d1", week: 1, year: 2026 }],
        },
      ]),
    ).toBe("/college/mens-basketball/rankings");
  });
});
