import { describe, expect, it } from "vitest";

import {
  dedupeAcrossDivisions,
  matchConference,
  matchSchool,
  newConferenceKey,
  normalizeConferenceName,
  normalizeSchoolName,
  type ProviderMembership,
  planAffiliations,
  type SanityConference,
  type SanitySchool,
} from "./plan";

const conferences: SanityConference[] = [
  {
    _id: "bigsky",
    name: "Big Sky Conference",
    shortName: "Big Sky",
    abbreviation: "Big Sky",
    division: "d1",
    sports: ["football", "mens-basketball"],
  },
  {
    _id: "miaa2",
    name: "Mid-America Intercollegiate Athletics Association",
    shortName: "MIAA",
    division: "d2",
    sports: ["football"],
  },
  {
    _id: "miaa3",
    name: "Michigan Intercollegiate Athletic Association",
    shortName: "MIAA",
    division: "d3",
    sports: ["football"],
  },
  {
    _id: "mac1",
    name: "Mid-American Conference",
    shortName: "MAC",
    abbreviation: "MAC",
    division: "d1",
    sports: [],
  },
  {
    _id: "mac3",
    name: "Middle Atlantic Conference",
    shortName: "MAC",
    division: "d3",
    sports: [],
  },
  {
    _id: "fbsind",
    name: "FBS Independent",
    shortName: "FBS Independent",
    division: "d1",
    sports: ["football"],
  },
];

const school = (
  _id: string,
  name: string,
  shortName: string | null,
  nickname: string | null,
  affiliations: SanitySchool["affiliations"] = [],
): SanitySchool => ({ _id, id: _id, name, shortName, nickname, affiliations });

const schools = [
  school("montana", "University of Montana", "Montana", "Grizzlies"),
  school(
    "nwmo",
    "Northwest Missouri State University",
    "Northwest Missouri State",
    "Bearcats",
  ),
  school("ucf", "University of Central Florida", "UCF", "Knights"),
  school("regis", "Regis University", "Regis", "Rangers"),
  school("regis-college", "Regis College", "Regis (MA)", "Pride"),
];

const membership = (
  overrides: Partial<ProviderMembership> & {
    team: ProviderMembership["team"];
  },
): ProviderMembership => ({
  source: "espn",
  season: "2026",
  sport: "football",
  division: "d1",
  conference: { name: "Big Sky Conference" },
  ...overrides,
});

describe("normalizeConferenceName", () => {
  it("drops filler words and punctuation", () => {
    expect(normalizeConferenceName("The Big West Conference")).toBe("big west");
    expect(normalizeConferenceName("Big South-OVC")).toBe("big south ovc");
    expect(
      normalizeConferenceName("College Conference of Illinois & Wisconsin"),
    ).toBe("college of illinois and wisconsin");
  });
});

describe("matchConference", () => {
  it("matches by name or short name", () => {
    expect(matchConference({ name: "Big Sky" }, "d1", conferences)?._id).toBe(
      "bigsky",
    );
  });

  it("prefers the same division when a name is shared", () => {
    expect(matchConference({ name: "MIAA" }, "d3", conferences)?._id).toBe(
      "miaa3",
    );
    expect(matchConference({ name: "MIAA" }, "d2", conferences)?._id).toBe(
      "miaa2",
    );
    expect(matchConference({ name: "MIAA" }, "d1", conferences)).toBeNull();
  });

  it("uses abbreviations only within a division", () => {
    expect(
      matchConference(
        { name: "Unknown", abbreviation: "MAC" },
        "d1",
        conferences,
      )?._id,
    ).toBe("mac1");
    expect(
      matchConference(
        { name: "Unknown", abbreviation: "ZZZ" },
        "d1",
        conferences,
      ),
    ).toBeNull();
  });

  it("falls back to the alias table", () => {
    expect(
      matchConference({ name: "FBS Independents" }, "d1", conferences)?._id,
    ).toBe("fbsind");
    expect(matchConference({ name: "Michigan" }, "d3", conferences)?._id).toBe(
      "miaa3",
    );
  });
});

describe("newConferenceKey", () => {
  it("knows the conferences we'd create, by division", () => {
    expect(newConferenceKey("SUNYAC", "d3")).toBe("d3|sunyac");
    expect(newConferenceKey("SUNYAC", "d2")).toBeNull();
  });
});

describe("matchSchool", () => {
  const ids = new Map([["2", "montana"]]);

  it("trusts ESPN ids from Postgres", () => {
    const match = matchSchool(
      { espnId: "2", location: null, displayName: "Anything", mascot: null },
      schools,
      ids,
    );
    expect(match).toMatchObject({ by: "espn-id", school: { _id: "montana" } });
  });

  it("trusts an identical full name held by one school", () => {
    expect(normalizeSchoolName("Regis University (Colorado)")).toBe(
      "regis university",
    );
    expect(
      matchSchool(
        {
          location: "Northwest Mo. St.",
          displayName: "Northwest Missouri State University",
          mascot: null,
        },
        schools,
        ids,
      ),
    ).toMatchObject({ by: "name", school: { _id: "nwmo" } });
    expect(
      matchSchool(
        {
          location: "Regis (CO)",
          displayName: "Regis University (Colorado)",
          mascot: null,
        },
        schools,
        ids,
      ),
    ).toMatchObject({ school: { _id: "regis" } });
  });

  it("lets a matching mascot confirm a weaker name", () => {
    expect(
      matchSchool(
        {
          location: "UCF",
          displayName: "UCF Knights",
          mascot: "Knights",
          abbreviation: "UCF",
        },
        schools,
        ids,
      ),
    ).toMatchObject({ school: { _id: "ucf" } });
  });

  it("refuses unknown and unclear teams", () => {
    expect(
      matchSchool(
        { location: "Nowhere", displayName: "Nowhere Tech", mascot: "Owls" },
        schools,
        ids,
      ),
    ).toEqual({ school: null, reason: "no-candidate" });
    const unclear = matchSchool(
      { location: "Regis", displayName: "Regis", mascot: null },
      schools,
      ids,
    );
    expect(unclear).toMatchObject({ school: null, reason: "ambiguous" });
  });
});

describe("dedupeAcrossDivisions", () => {
  it("keeps each team in its conference's main division", () => {
    const team = {
      location: "Bemidji St.",
      displayName: "Bemidji State University",
      mascot: null,
    };
    const rows = [
      ...Array.from({ length: 5 }, (_, i) =>
        membership({
          source: "ncaa",
          division: "d2",
          conference: { name: "NSIC" },
          team: { ...team, displayName: `Team ${i}` },
        }),
      ),
      membership({
        source: "ncaa",
        division: "d2",
        conference: { name: "NSIC" },
        team,
      }),
      membership({
        source: "ncaa",
        division: "d3",
        conference: { name: "NSIC" },
        team,
      }),
    ];
    const kept = dedupeAcrossDivisions(rows).filter(
      (row) => row.team.displayName === team.displayName,
    );
    expect(kept).toHaveLength(1);
    expect(kept[0]?.division).toBe("d2");
  });
});

describe("planAffiliations", () => {
  const ids = new Map([["2", "montana"]]);
  const montana = (overrides: Partial<ProviderMembership> = {}) =>
    membership({
      team: {
        espnId: "2",
        location: "Montana",
        displayName: "Montana Grizzlies",
        mascot: "Grizzlies",
      },
      ...overrides,
    });

  it("adds missing sports, keeps correct ones, and flags changes", () => {
    const plan = planAffiliations({
      memberships: [
        montana(),
        montana({ sport: "mens-basketball" }),
        montana({
          sport: "womens-basketball",
          conference: { name: "Mid-American Conference" },
        }),
      ],
      schools: [
        school("montana", "University of Montana", "Montana", "Grizzlies", [
          { sport: "mens-basketball", conferenceId: "bigsky" },
          { sport: "womens-basketball", conferenceId: "bigsky" },
        ]),
      ],
      conferences,
      schoolIdByEspnId: ids,
    });
    expect(plan.add.map((change) => change.sport)).toEqual(["football"]);
    expect(plan.unchanged).toBe(1);
    expect(plan.changed).toEqual([
      expect.objectContaining({
        sport: "womens-basketball",
        conferenceName: "Mid-American Conference",
        currentConferenceName: "Big Sky Conference",
      }),
    ]);
    // Mid-American lists no women's basketball yet.
    expect(plan.conferenceSports).toEqual([
      {
        conferenceId: "mac1",
        name: "Mid-American Conference",
        sport: "womens-basketball",
      },
    ]);
  });

  it("prefers ESPN over the older NCAA feed", () => {
    const plan = planAffiliations({
      memberships: [
        montana({
          source: "ncaa",
          season: "2024-25",
          conference: { name: "Mid-American Conference" },
        }),
        montana(),
        montana({
          source: "ncaa",
          season: "2024-25",
          conference: { name: "Mid-American Conference" },
        }),
      ],
      schools,
      conferences,
      schoolIdByEspnId: ids,
    });
    expect(plan.add).toEqual([
      expect.objectContaining({ conferenceId: "bigsky", source: "espn 2026" }),
    ]);
  });

  it("reports unknown conferences, unmatched teams, and conflicts", () => {
    const nobody = {
      location: "Nowhere",
      displayName: "Nowhere Tech",
      mascot: "Owls",
    };
    const plan = planAffiliations({
      memberships: [
        membership({ conference: { name: "Atlantis League" }, team: nobody }),
        membership({
          conference: { name: "Atlantis League" },
          sport: "mens-basketball",
          team: nobody,
        }),
        membership({ team: nobody }),
        montana(),
        montana({ conference: { name: "Mid-American Conference" } }),
      ],
      schools,
      conferences,
      schoolIdByEspnId: ids,
    });
    expect(plan.unknownConferences).toEqual([
      {
        name: "Atlantis League",
        division: "d1",
        sports: ["football", "mens-basketball"],
        teams: 2,
        source: "espn 2026",
      },
    ]);
    expect(plan.unmatchedTeams).toEqual([
      expect.objectContaining({ team: "Nowhere Tech", reason: "no-candidate" }),
    ]);
    expect(plan.conflicts).toEqual([
      {
        schoolName: "University of Montana",
        sport: "football",
        conferences: ["Big Sky Conference", "Mid-American Conference"],
      },
    ]);
    expect(plan.add).toEqual([]);
  });
});
