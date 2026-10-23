import { describe, expect, it } from "vitest";

import {
  buildSportNewsFilterOptions,
  getDivisionConferences,
} from "@/lib/sport-news-filters";

describe("buildSportNewsFilterOptions", () => {
  it("returns empty options when groupings are missing", () => {
    expect(
      buildSportNewsFilterOptions("football", [{ slug: "football" }]),
    ).toEqual({ divisions: [], conferences: [] });
    expect(buildSportNewsFilterOptions("football", null)).toEqual({
      divisions: [],
      conferences: [],
    });
  });

  it("uses grouping and conference name fallbacks", () => {
    expect(
      buildSportNewsFilterOptions("football", [
        {
          slug: "football",
          groupings: [
            {
              slug: "fbs",
              name: null,
              conferences: null,
            },
            {
              slug: "fcs",
              name: "FCS",
              conferences: [
                {
                  slug: "sec",
                  name: "Southeastern Conference",
                  shortName: null,
                },
                { slug: "acc", name: null, shortName: "ACC" },
                { slug: "big12", name: null, shortName: null },
                { slug: null, name: "Skip" },
              ],
            },
            null,
          ],
        },
      ]),
    ).toEqual({
      divisions: [
        { slug: "fbs", name: "fbs" },
        { slug: "fcs", name: "FCS" },
      ],
      conferences: [
        {
          slug: "sec",
          name: "Southeastern Conference",
          divisionSlug: "fcs",
          sportSlug: "football",
        },
        {
          slug: "acc",
          name: "ACC",
          divisionSlug: "fcs",
          sportSlug: "football",
        },
        {
          slug: "big12",
          name: "big12",
          divisionSlug: "fcs",
          sportSlug: "football",
        },
      ],
    });
  });
});

describe("getDivisionConferences", () => {
  it("filters by division slug", () => {
    const conferences = [
      {
        slug: "sec",
        name: "SEC",
        divisionSlug: "fbs",
        sportSlug: "football",
      },
    ];
    expect(getDivisionConferences(conferences, "fbs")).toEqual(conferences);
    expect(getDivisionConferences(conferences, "fcs")).toEqual([]);
  });
});
