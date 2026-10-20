import { describe, expect, it } from "vitest";

import { buildCollegeNewsFilterOptions } from "@/lib/college-news-filters";

describe("buildCollegeNewsFilterOptions", () => {
  it("returns empty options without navigation", () => {
    expect(buildCollegeNewsFilterOptions(null)).toEqual({
      sports: [],
      divisions: [],
      conferences: [],
    });
  });

  it("maps sports, divisions, and conferences", () => {
    expect(
      buildCollegeNewsFilterOptions([
        {
          slug: "football",
          name: "Football",
          groupings: [
            {
              slug: null,
              name: "Skip division",
              conferences: [],
            },
            {
              slug: "fbs",
              name: "FBS",
              conferences: [
                {
                  slug: "sec",
                  name: "Southeastern Conference",
                  shortName: "SEC",
                },
              ],
            },
            { slug: null, name: "Skip" },
          ],
        },
        { slug: "other", groupings: [] },
      ]),
    ).toEqual({
      sports: [
        { slug: "football", name: "Football" },
        { slug: "other", name: "other" },
      ],
      divisions: [{ slug: "fbs", name: "FBS", sportSlug: "football" }],
      conferences: [
        {
          slug: "sec",
          name: "SEC",
          divisionSlug: "fbs",
          sportSlug: "football",
        },
      ],
    });
  });
});
