import { describe, expect, it } from "vitest";

import { nameSimilarity, suggestSchools } from "./team-matching";

const schools = [
  {
    id: "shsu",
    name: "Sam Houston State University",
    shortName: "Sam Houston",
    nickname: "Bearkats",
  },
  {
    id: "selu",
    name: "Southeastern Louisiana University",
    shortName: "Southeastern Louisiana",
    nickname: "Lions",
  },
  {
    id: "utm",
    name: "University of Tennessee at Martin",
    shortName: "UT Martin",
    nickname: "Skyhawks",
  },
  {
    id: "tsu",
    name: "Tennessee State University",
    shortName: "Tennessee State",
    nickname: "Tigers",
  },
  {
    id: "del",
    name: "University of Delaware",
    shortName: "Delaware",
    nickname: "Blue Hens",
  },
  {
    id: "dsu",
    name: "Delaware State University",
    shortName: "Delaware State",
    nickname: "Hornets",
  },
];

describe("team matching", () => {
  it("ignores filler words and expands common abbreviations", () => {
    expect(
      nameSimilarity("Sam Houston St.", "Sam Houston State University"),
    ).toBe(1);
    expect(nameSimilarity("SE Louisiana", "Southeastern Louisiana")).toBe(1);
  });

  it("puts the right school first for ESPN names", () => {
    const cases: Array<
      [{ location: string; displayName: string; mascot: string }, string]
    > = [
      [
        {
          location: "Sam Houston",
          displayName: "Sam Houston Bearkats",
          mascot: "Bearkats",
        },
        "shsu",
      ],
      [
        {
          location: "SE Louisiana",
          displayName: "SE Louisiana Lions",
          mascot: "Lions",
        },
        "selu",
      ],
      [
        {
          location: "UT Martin",
          displayName: "UT Martin Skyhawks",
          mascot: "Skyhawks",
        },
        "utm",
      ],
      [
        {
          location: "Delaware",
          displayName: "Delaware Blue Hens",
          mascot: "Blue Hens",
        },
        "del",
      ],
      [
        {
          location: "Delaware State",
          displayName: "Delaware State Hornets",
          mascot: "Hornets",
        },
        "dsu",
      ],
    ];
    for (const [team, expected] of cases) {
      expect(suggestSchools(team, schools)[0]?.id).toBe(expected);
    }
  });

  it("suggests nothing when no name overlaps", () => {
    expect(
      suggestSchools(
        {
          location: "Hawai'i",
          displayName: "Hawai'i Rainbow Warriors",
          mascot: "Rainbow Warriors",
        },
        schools,
      ),
    ).toEqual([]);
  });
});
