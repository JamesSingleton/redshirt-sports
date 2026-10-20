import { describe, expect, it } from "vitest";

import {
  articleTeamsInStory,
  buildArticleBreadcrumbs,
} from "@/lib/article-page";

describe("articleTeamsInStory", () => {
  it("returns labeled team links with slugs", () => {
    expect(
      articleTeamsInStory({
        teams: [
          {
            _id: "s1",
            name: "Montana State University",
            shortName: "Montana State",
            nickname: "Bobcats",
            slug: "montana-state-bobcats",
            image: null,
          },
        ],
      } as never),
    ).toEqual([
      {
        _id: "s1",
        slug: "montana-state-bobcats",
        label: "Montana State Bobcats",
        image: null,
      },
    ]);
  });
});

describe("buildArticleBreadcrumbs", () => {
  it("includes a single conference before News", () => {
    const crumbs = buildArticleBreadcrumbs({
      sport: { slug: "football", title: "Football", _id: "sport-1" },
      division: { name: "D1", slug: "d1" },
      sportSubgrouping: { slug: "fbs", shortName: "FBS", name: "FBS" },
      conferences: [
        {
          slug: "sec",
          shortName: "SEC",
          name: "Southeastern Conference",
          division: { slug: "d1" },
          sportSubdivisionAffiliations: [
            { sport: { _id: "sport-1" }, subgrouping: { slug: "fbs" } },
          ],
        },
      ],
    } as never);

    expect(crumbs.map((c) => c.title)).toContain("SEC");
    expect(crumbs.find((c) => c.title === "SEC")?.href).toBe(
      "/college/football/news/fbs/sec",
    );
  });
});
