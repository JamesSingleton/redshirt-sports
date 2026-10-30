import { describe, expect, it } from "vitest";

import {
  buildTeamHubKicker,
  buildTeamInfoAthleticsLink,
  buildTeamInfoFactRows,
  buildTeamSocialLinks,
  conferenceNewsHrefForAffiliation,
} from "@/lib/team-school-affiliations";

const fcsFootballAffiliation = [
  {
    sport: { slug: "football" },
    conference: {
      name: "Big Sky Conference",
      shortName: "Big Sky",
      primaryClassification: { slug: "d1", name: "Division I" },
      sportSubdivisions: [
        {
          sport: { slug: "football" },
          subdivision: { shortName: "FCS", name: "FCS", slug: "fcs" },
        },
      ],
    },
  },
];

describe("team school affiliations", () => {
  it("builds team hub kicker from affiliations", () => {
    expect(buildTeamHubKicker(fcsFootballAffiliation)).toBe(
      "Big Sky · FCS football",
    );
  });

  it("returns null when affiliations are empty", () => {
    expect(buildTeamHubKicker(null)).toBeNull();
    expect(buildTeamHubKicker([])).toBeNull();
  });

  it("builds info fact rows per sport", () => {
    expect(
      buildTeamInfoFactRows(
        { name: "Montana State University", nickname: "Bobcats" },
        [
          ...fcsFootballAffiliation,
          {
            sport: { slug: "mens-basketball" },
            conference: {
              name: "Big Sky Conference",
              shortName: "Big Sky",
              slug: "big-sky",
              primaryClassification: { slug: "d1", name: "Division I" },
              sportSubdivisions: null,
            },
          },
        ],
      ),
    ).toEqual([
      { label: "School", value: "Montana State University" },
      { label: "Nickname", value: "Bobcats" },
      { label: "Football", value: "FCS · Big Sky" },
      { label: "Basketball", value: "Division I · Big Sky" },
    ]);
  });

  it("builds athletics and per-network social links", () => {
    expect(
      buildTeamInfoAthleticsLink("https://www.msubobcats.com/")?.subtitle,
    ).toBe("msubobcats.com");
    expect(
      buildTeamSocialLinks({
        facebook: "https://facebook.com/alabama",
        twitter: "https://x.com/alabama",
      }),
    ).toEqual([
      { id: "twitter", label: "X", href: "https://x.com/alabama" },
      {
        id: "facebook",
        label: "Facebook",
        href: "https://facebook.com/alabama",
      },
    ]);
    const footballAffiliation = fcsFootballAffiliation[0]!;
    expect(
      conferenceNewsHrefForAffiliation({
        sport: footballAffiliation.sport,
        conference: {
          ...footballAffiliation.conference,
          slug: "big-sky",
        },
      }),
    ).toBe("/college/football/news/fcs/big-sky");
    expect(buildTeamInfoAthleticsLink(null)).toBeNull();
    expect(
      buildTeamSocialLinks({ customNetwork: "https://example.com" }),
    ).toEqual([
      {
        id: "customNetwork",
        label: "customNetwork",
        href: "https://example.com",
      },
    ]);
    expect(
      conferenceNewsHrefForAffiliation({
        sport: { slug: "mens-basketball" },
        conference: {
          name: null,
          shortName: null,
          slug: "big-sky",
          primaryClassification: { slug: "d1", name: "D-I" },
        },
      }),
    ).toBe("/college/mens-basketball/news/d1/big-sky");
    expect(
      conferenceNewsHrefForAffiliation({
        sport: { slug: "football" },
        conference: { name: null, shortName: null, slug: "sec" },
      }),
    ).toBeNull();
    expect(buildTeamInfoAthleticsLink("not-a-valid-url")?.subtitle).toBe(
      "not-a-valid-url",
    );
  });

  it("covers hub kicker and fact row variants", () => {
    expect(
      buildTeamHubKicker([
        {
          sport: { slug: "football" },
          conference: {
            shortName: "SEC",
            name: "SEC",
            sportSubdivisions: [
              {
                sport: { slug: "football" },
                subdivision: { slug: "fbs", shortName: "FBS", name: "FBS" },
              },
            ],
          },
        },
        {
          sport: { slug: "mens-basketball" },
          conference: {
            name: null,
            shortName: "SEC",
            primaryClassification: { slug: "d2", name: "Division II" },
          },
        },
        {
          sport: { slug: "womens-basketball" },
          conference: {
            name: null,
            shortName: "Other",
            primaryClassification: { slug: "d3", name: "Division III" },
          },
        },
      ]),
    ).toContain("FBS football");

    expect(
      buildTeamInfoFactRows({ name: "School", nickname: null }, [
        {
          sport: { slug: "football" },
          conference: { shortName: "Ind", name: "Independent" },
        },
        {
          sport: { slug: "mens-basketball" },
          conference: {
            name: null,
            slug: "b1",
            shortName: "B1",
            primaryClassification: { slug: "d1", name: "D-I" },
          },
        },
        {
          sport: { slug: "womens-basketball" },
          conference: {
            name: null,
            slug: "b2",
            shortName: "B2",
            primaryClassification: { slug: "naia", name: "NAIA" },
          },
        },
      ]).map((row) => row.label),
    ).toEqual(["School", "Football", "Men's basketball", "Women's basketball"]);

    expect(
      buildTeamHubKicker([
        {
          sport: { slug: "football" },
          conference: {
            name: null,
            shortName: "MWC",
            sportSubdivisions: [
              {
                sport: { slug: "football" },
                subdivision: { slug: "d2", shortName: "D2", name: "D2" },
              },
            ],
          },
        },
      ]),
    ).toContain("Football");

    expect(
      buildTeamInfoFactRows({ name: "School", nickname: "Cats" }, [
        {
          sport: { slug: "womens-basketball" },
          conference: {
            name: null,
            shortName: "Horizon",
            primaryClassification: { slug: "d1", name: "D-I" },
          },
        },
      ]).find((row) => row.label === "Basketball"),
    ).toEqual({ label: "Basketball", value: "Division I · Horizon" });

    expect(
      buildTeamInfoFactRows(
        { name: "University of Richmond", nickname: "Spiders" },
        [
          {
            sport: { slug: "mens-basketball" },
            conference: {
              name: "Atlantic 10 Conference",
              shortName: "Atlantic 10",
              slug: "atlantic-10-conference",
              primaryClassification: null,
              sportSubdivisionAffiliations: [
                {
                  sport: { slug: "mens-basketball" },
                  subgrouping: {
                    shortName: "Mid-Major",
                    name: "Mid-Major",
                    slug: "mid-major",
                  },
                },
              ],
            },
          },
          {
            sport: { slug: "womens-basketball" },
            conference: {
              name: "Atlantic 10 Conference",
              shortName: "Atlantic 10",
              slug: "atlantic-10-conference",
              sportSubdivisionAffiliations: [
                {
                  sport: { slug: "womens-basketball" },
                  subgrouping: {
                    shortName: "Mid-Major",
                    name: "Mid-Major",
                    slug: "mid-major",
                  },
                },
              ],
            },
          },
        ],
      ).find((row) => row.label === "Basketball"),
    ).toEqual({ label: "Basketball", value: "Mid-Major · Atlantic 10" });

    expect(
      buildTeamInfoFactRows({ name: "School", nickname: null }, [
        {
          sport: { slug: "mens-basketball" },
          conference: {
            name: null,
            shortName: "ACC",
            slug: "acc",
            sportSubdivisions: [
              {
                sport: { slug: "mens-basketball" },
                subdivision: {
                  shortName: null,
                  name: null,
                  slug: "power-conferences",
                },
              },
            ],
          },
        },
      ]).find((row) => row.label === "Basketball"),
    ).toEqual({ label: "Basketball", value: "Power Conference · ACC" });

    expect(
      buildTeamInfoFactRows({ name: "School", nickname: null }, [
        {
          sport: { slug: "mens-basketball" },
          conference: {
            name: "Atlantic 10 Conference",
            shortName: "Atlantic 10",
            slug: "atlantic-10-conference",
          },
        },
      ]).find((row) => row.label === "Basketball"),
    ).toEqual({ label: "Basketball", value: "Atlantic 10" });

    expect(buildTeamSocialLinks(null)).toEqual([]);
    expect(
      conferenceNewsHrefForAffiliation({
        sport: null,
        conference: { name: null, shortName: null, slug: "x" },
      }),
    ).toBeNull();
  });
});
