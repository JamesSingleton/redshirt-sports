import { describe, expect, it } from "vitest";

import type { TeamPost } from "@/components/teams/team-post-card";
import {
  footballAffiliationDivisionSlug,
  groupTeamPostsBySport,
  pickFootballRankingPoll,
} from "@/lib/team-hub";

describe("team hub helpers", () => {
  it("groups posts by sport slug", () => {
    const posts = [
      { sport: { slug: "football" } } as TeamPost,
      { sport: { slug: "football" } } as TeamPost,
      { sport: null } as TeamPost,
    ];
    const grouped = groupTeamPostsBySport(posts);
    expect(grouped.get("football")).toHaveLength(2);
    expect(grouped.get("other")).toHaveLength(1);
  });

  it("picks football poll by affiliation and fallbacks", () => {
    const polls = [
      { sportSlug: "mens-basketball", pollSlug: "d1" },
      { sportSlug: "football", pollSlug: "fbs" },
      { sportSlug: "football", pollSlug: "fcs" },
    ] as never;
    expect(pickFootballRankingPoll(polls, null)?.pollSlug).toBe("fcs");
    expect(pickFootballRankingPoll(polls, "fbs")?.pollSlug).toBe("fbs");
    expect(pickFootballRankingPoll(polls, "d2")?.pollSlug).toBe("fcs");
    expect(
      pickFootballRankingPoll(
        [{ sportSlug: "football", pollSlug: "fbs" }] as never,
        "fcs",
      )?.pollSlug,
    ).toBe("fbs");
    expect(
      pickFootballRankingPoll([
        { sportSlug: "football", pollSlug: "d2" },
      ] as never)?.pollSlug,
    ).toBe("d2");
    expect(
      pickFootballRankingPoll([
        { sportSlug: "football", pollSlug: "naia" },
      ] as never)?.pollSlug,
    ).toBe("naia");
    expect(pickFootballRankingPoll([], "fbs")).toBeNull();
  });

  it("reads football subdivision from affiliations", () => {
    expect(
      footballAffiliationDivisionSlug([
        {
          sport: { slug: "football" },
          conference: {
            name: null,
            shortName: null,
            sportSubdivisions: [
              {
                sport: { slug: "football" },
                subdivision: { slug: "fcs", shortName: "FCS", name: "FCS" },
              },
            ],
          },
        },
      ]),
    ).toBe("fcs");
    expect(footballAffiliationDivisionSlug(null)).toBeNull();
    expect(
      footballAffiliationDivisionSlug([
        { sport: { slug: "mens-basketball" }, conference: null },
      ]),
    ).toBeNull();
    expect(
      footballAffiliationDivisionSlug([
        {
          sport: { slug: "football" },
          conference: { name: null, shortName: null, sportSubdivisions: [] },
        },
      ]),
    ).toBeNull();
    expect(
      footballAffiliationDivisionSlug([
        {
          sport: { slug: "football" },
          conference: {
            name: null,
            shortName: null,
            sportSubdivisionAffiliations: [
              {
                sport: { slug: "football" },
                subgrouping: { slug: "fbs", shortName: "FBS", name: "FBS" },
              },
            ],
          },
        },
      ]),
    ).toBe("fbs");
    expect(
      footballAffiliationDivisionSlug([
        {
          sport: { slug: "football" },
          conference: {
            name: null,
            shortName: null,
            sportSubdivisionAffiliations: [
              {
                sport: { slug: "mens-basketball" },
                subgrouping: {
                  slug: "mid-major",
                  shortName: "Mid-Major",
                  name: "Mid-Major",
                },
              },
            ],
            sportSubdivisions: [
              {
                sport: { slug: "football" },
                subdivision: { slug: "fcs", shortName: "FCS", name: "FCS" },
              },
            ],
          },
        },
      ]),
    ).toBe("fcs");
  });
});
