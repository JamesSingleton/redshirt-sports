import { describe, expect, it } from "vitest";

import {
  articleKicker,
  articleTeamsInStory,
  buildArticleBreadcrumbs,
  conferenceNewsHref,
  divisionNewsSegment,
} from "@/lib/article-page";

describe("articleTeamsInStory", () => {
  it("skips teams without slugs or labels", () => {
    expect(
      articleTeamsInStory({
        teams: [
          { _id: "s1", slug: null, name: "A", shortName: "A", nickname: null },
          { _id: "s2", slug: "b", name: "", shortName: null, nickname: null },
        ],
      } as never),
    ).toEqual([]);
  });

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

describe("articleKicker", () => {
  it("joins division and story type", () => {
    expect(
      articleKicker({
        division: { name: "D1", slug: "d1" },
        sportSubgrouping: { slug: "fbs", shortName: "FBS", name: "FBS" },
        storyType: "analysis",
        tags: [],
      } as never),
    ).toBe("FBS · analysis");
    expect(articleKicker({ tags: [] } as never)).toBe("News");
    expect(
      articleKicker({
        division: null,
        tags: [{ name: "Feature" }],
      } as never),
    ).toBe("Feature");
    expect(
      divisionNewsSegment(
        { name: "D1", slug: "d1" } as never,
        { slug: null, shortName: null, name: null } as never,
      ),
    ).toEqual({ label: "D1", slug: "d1" });
  });
});

describe("conferenceNewsHref", () => {
  it("builds conference news links from post context", () => {
    const href = conferenceNewsHref(
      {
        sport: { slug: "football", _id: "sport-1" },
        sportSubgrouping: { slug: "fbs" },
        division: { slug: "d1" },
      } as never,
      {
        slug: "sec",
        division: { slug: "d1" },
        sportSubdivisionAffiliations: [
          {
            sport: { _id: "sport-1" },
            subgrouping: { slug: "fbs" },
          },
        ],
      } as never,
    );
    expect(href).toBe("/college/football/news/fbs/sec");
  });

  it("uses conference division when affiliation is missing", () => {
    expect(
      conferenceNewsHref(
        { sport: { slug: "football", _id: "sport-1" } } as never,
        {
          slug: "sec",
          division: { slug: "fbs" },
          sportSubdivisionAffiliations: [],
        } as never,
      ),
    ).toBe("/college/football/news/fbs/sec");
  });

  it("returns null without sport slug", () => {
    expect(
      conferenceNewsHref({ sport: null } as never, { slug: "sec" } as never),
    ).toBeNull();
  });

  it("returns null without a division segment or conference slug", () => {
    expect(
      conferenceNewsHref(
        { sport: { slug: "football", _id: "sport-1" } } as never,
        {
          slug: "sec",
          division: undefined,
          sportSubdivisionAffiliations: [],
        } as never,
      ),
    ).toBeNull();
    expect(
      conferenceNewsHref(
        { sport: { slug: "football", _id: "sport-1" } } as never,
        { slug: null, division: { slug: "fbs" } } as never,
      ),
    ).toBeNull();
  });
});

describe("divisionNewsSegment", () => {
  it("uses subgrouping for D1 and division otherwise", () => {
    expect(
      divisionNewsSegment(
        { name: "D1", slug: "d1" } as never,
        { slug: "fbs", shortName: "FBS", name: "FBS" } as never,
      ),
    ).toEqual({ label: "FBS", slug: "fbs" });
    expect(
      divisionNewsSegment(
        { name: "D1", slug: "d1" } as never,
        {
          slug: "fbs",
          shortName: null,
          name: "Football Subdivision",
        } as never,
      ),
    ).toEqual({ label: "Football Subdivision", slug: "fbs" });
    expect(
      divisionNewsSegment(
        { name: "D1", slug: "d1" } as never,
        { slug: "fbs", shortName: null, name: null } as never,
      ),
    ).toEqual({ label: "D-I", slug: "fbs" });
    expect(divisionNewsSegment(null, null)).toBeNull();
    expect(
      divisionNewsSegment({ name: "D2", slug: "d2" } as never, null),
    ).toEqual({
      label: "D2",
      slug: "d2",
    });
  });
});

describe("buildArticleBreadcrumbs", () => {
  it("returns empty crumbs without sport", () => {
    expect(buildArticleBreadcrumbs({ sport: null } as never)).toEqual([]);
  });

  it("uses sport slug when title is missing", () => {
    const crumbs = buildArticleBreadcrumbs({
      sport: { slug: "football", title: null },
      division: null,
      conferences: [],
    } as never);
    expect(crumbs[0]?.title).toBe("College Football");
  });

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

  it("omits conference crumbs when href cannot be built", () => {
    const crumbs = buildArticleBreadcrumbs({
      sport: { slug: "football", title: "Football", _id: "sport-1" },
      division: { name: "D1", slug: "d1" },
      conferences: [{ slug: null, name: "SEC", shortName: "SEC" }],
    } as never);
    expect(crumbs.some((c) => c.title === "SEC")).toBe(false);
  });
});
