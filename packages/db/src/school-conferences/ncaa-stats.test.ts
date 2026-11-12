import { describe, expect, it } from "vitest";

import { ncaaStatsMemberships } from "./ncaa-stats";
import {
  type ProviderMembership,
  planAffiliations,
  type SanityConference,
  type SanitySchool,
} from "./plan";

const feedRow = (
  short: string,
  full: string,
  conference: string,
  sport: ProviderMembership["sport"] = "mens-basketball",
): ProviderMembership => ({
  source: "ncaa",
  season: "2024-25",
  sport,
  division: "d3",
  conference: { name: conference, abbreviation: conference },
  team: {
    location: short,
    displayName: full,
    mascot: null,
    abbreviation: null,
  },
});

describe("ncaaStatsMemberships", () => {
  it("takes the conference from the snapshot and the full name from the feed", () => {
    const memberships = ncaaStatsMemberships(
      {
        season: "2026-27",
        rows: [
          { sport: "MBB", div: 3, conf: "NCAC", teams: ["John Carroll"] },
          { sport: "WBB", div: 2, conf: "CACC", teams: ["New Program"] },
        ],
      },
      [feedRow("John Carroll", "John Carroll University", "OAC")],
    );

    expect(memberships).toEqual([
      {
        source: "ncaa-stats",
        season: "2026-27",
        sport: "mens-basketball",
        division: "d3",
        conference: { name: "NCAC", abbreviation: "NCAC" },
        team: {
          location: "John Carroll",
          displayName: "John Carroll University",
          mascot: null,
          abbreviation: null,
        },
      },
      expect.objectContaining({
        sport: "womens-basketball",
        division: "d2",
        // A team the feed never saw keeps its short name.
        team: expect.objectContaining({ displayName: "New Program" }),
      }),
    ]);
  });
});

describe("planAffiliations with stats.ncaa.org", () => {
  const conferences: SanityConference[] = [
    {
      _id: "oac",
      name: "Ohio Athletic Conference",
      shortName: "OAC",
      division: "d3",
      sports: ["mens-basketball"],
    },
    {
      _id: "ncac",
      name: "North Coast Athletic Conference",
      shortName: "NCAC",
      division: "d3",
      sports: ["mens-basketball"],
    },
  ];
  const johnCarroll: SanitySchool = {
    _id: "jcu",
    id: "jcu",
    name: "John Carroll University",
    shortName: "John Carroll",
    nickname: "Blue Streaks",
    affiliations: [{ sport: "mens-basketball", conferenceId: "ncac" }],
  };

  it("prefers this season's list over the 2024-25 feed", () => {
    const feed = [feedRow("John Carroll", "John Carroll University", "OAC")];
    const plan = planAffiliations({
      memberships: [
        ...feed,
        ...ncaaStatsMemberships(
          {
            season: "2026-27",
            rows: [
              { sport: "MBB", div: 3, conf: "NCAC", teams: ["John Carroll"] },
            ],
          },
          feed,
        ),
      ],
      schools: [johnCarroll],
      conferences,
      schoolIdByEspnId: new Map(),
    });

    expect(plan.changed).toEqual([]);
    expect(plan.unchanged).toBe(1);
  });
});
