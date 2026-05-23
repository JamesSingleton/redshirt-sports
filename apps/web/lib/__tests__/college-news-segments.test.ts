import { describe, expect, it } from "vitest";

import {
  resolveConferenceNewsPathSegment,
  resolveNewsRouteSegment,
} from "../college-news-segments";

describe("resolveConferenceNewsPathSegment", () => {
  it("uses the subgrouping affiliated for the article sport", () => {
    const segment = resolveConferenceNewsPathSegment(
      {
        primaryClassification: { slug: "d1" },
        sportSubdivisionAffiliations: [
          {
            sport: { slug: "football" },
            subgrouping: { slug: "fbs" },
          },
          {
            sport: { slug: "mens-basketball" },
            subgrouping: { slug: "mid-major" },
          },
        ],
      },
      { sportSlug: "football" },
    );

    expect(segment).toBe("fbs");
  });

  it("uses primaryClassification when no subgrouping for that sport", () => {
    const segment = resolveConferenceNewsPathSegment(
      {
        slug: "great-lakes-intercollegiate-athletic-conference",
        primaryClassification: { slug: "d2" },
        sportSubdivisionAffiliations: [],
      },
      { sportSlug: "football" },
    );

    expect(segment).toBe("d2");
  });

  it("uses naia primaryClassification for NAIA conferences", () => {
    const segment = resolveConferenceNewsPathSegment(
      {
        slug: "appalachian-athletic-conference",
        primaryClassification: { slug: "naia" },
      },
      { sportSlug: "football" },
    );

    expect(segment).toBe("naia");
  });

  it("maps d1 primary to article sportSubgrouping for football URLs", () => {
    const segment = resolveConferenceNewsPathSegment(
      {
        slug: "nec",
        primaryClassification: { slug: "d1" },
        sportSubdivisionAffiliations: [],
      },
      {
        sportSlug: "football",
        articleSportSubgroupingSlug: "fcs",
      },
    );

    expect(segment).toBe("fcs");
  });

  it("keeps d2 primary when article is fcs", () => {
    const segment = resolveConferenceNewsPathSegment(
      {
        slug: "gliac",
        primaryClassification: { slug: "d2" },
      },
      {
        sportSlug: "football",
        articleSportSubgroupingSlug: "fcs",
      },
    );

    expect(segment).toBe("d2");
  });
});

describe("resolveNewsRouteSegment", () => {
  it("prefers article sportSubgrouping over classification", () => {
    expect(
      resolveNewsRouteSegment("fcs", "d1", true),
    ).toBe("fcs");
  });
});
