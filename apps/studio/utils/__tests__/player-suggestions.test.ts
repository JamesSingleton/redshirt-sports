import { describe, expect, it } from "vitest";

import {
  matchingOption,
  namedAsStaff,
  personNames,
  playsFor,
  rankedNames,
  withoutSchools,
} from "../player-suggestions";

describe("personNames", () => {
  it("finds introduced names, suffixes included", () => {
    expect(
      personNames(
        "Rob Footman Jr. Accounts for Five Touchdowns as TJ Johnson watches",
      ),
    ).toEqual(["Rob Footman Jr.", "TJ Johnson"]);
    expect(personNames("Keali'i Ah Yat threw for 300")).toEqual([
      "Keali'i Ah Yat",
    ]);
  });

  it("drops sentence openers, positions, and possessives", () => {
    expect(
      personNames(
        "So Ty Pennington threw a touchdown. Receiver Joey Stout scored. Pennington's run.",
      ),
    ).toEqual(["Ty Pennington", "Joey Stout"]);
  });

  it("skips places, dates, and conferences", () => {
    expect(
      personNames("No. 11 Montana at No. 3 Montana State in the Big Sky"),
    ).toEqual([]);
    expect(personNames("On Saturday November 22 the FCS Playoff")).toEqual([]);
  });
});

describe("rankedNames", () => {
  it("puts headline names first, then the body's most repeated", () => {
    expect(
      rankedNames(
        "Ty Pennington throws, runs and catches Northern Arizona past Montana",
        "Coach Brian Wright said Ty Pennington was great. Kade Smith ran. Kade Smith scored. Kade Smith again.",
      ),
    ).toEqual(["Ty Pennington", "Kade Smith", "Brian Wright"]);
  });

  it("reads names from the body, so a title-case headline can't split them wrong", () => {
    expect(
      rankedNames(
        "James Jones Becomes New Mexico State's First Shrine Bowler",
        "Running back James Jones received an invitation. Coach Jerry Kill said so.",
      ),
    ).toEqual(["James Jones", "Jerry Kill"]);
  });

  it("stops at the limit", () => {
    const body = Array.from(
      { length: 10 },
      (_, i) => `Player Name${String.fromCharCode(97 + i)}x`,
    ).join(". ");
    expect(rankedNames("", body, 3)).toHaveLength(3);
  });
});

describe("matchingOption", () => {
  const espn = (id: string, label: string) => ({
    value: `espn:${id}|${label}`,
    label: `${label} (Men's College Basketball)`,
  });
  const options = [
    espn("1", "Trap Johnson · VMI Keydets"),
    espn("2", "Trap Johnson · Other Team"),
    espn("3", "Trapp Johnson · VMI Keydets"),
  ];

  it("takes the exact name only", () => {
    expect(matchingOption("trap johnson", options)?.value).toBe(
      "espn:1|Trap Johnson · VMI Keydets",
    );
    expect(matchingOption("Trap Johnsen", options)).toBeNull();
  });

  it("keeps the article's teams when they're given", () => {
    expect(matchingOption("Trap Johnson", options, ["Other"])?.value).toBe(
      "espn:2|Trap Johnson · Other Team",
    );
    expect(matchingOption("Trap Johnson", options, ["Furman"])).toBeNull();
  });

  it("accepts our own players, whose labels carry no team", () => {
    const ours = {
      value: "redshirt:9|Trap Johnson",
      label: "Trap Johnson · G",
    };
    expect(matchingOption("Trap Johnson", [ours], ["Furman"])).toBe(ours);
  });
});

describe("playsFor", () => {
  it("matches a school under any of its names", () => {
    expect(playsFor("San José State Spartans", ["San Jose State"])).toBe(true);
    expect(
      playsFor("Massachusetts Minutemen", ["University of Massachusetts"]),
    ).toBe(true);
    expect(
      playsFor("East Tennessee State Buccaneers", [
        "ETSU",
        "East Tennessee State",
      ]),
    ).toBe(true);
    expect(playsFor("VMI Keydets", ["VMI"])).toBe(true);
  });

  it("doesn't match on a word every school shares", () => {
    expect(playsFor("Liberty Flames", ["Wheaton College"])).toBe(false);
    expect(playsFor("Ohio State Buckeyes", ["Kent State"])).toBe(false);
  });
});

describe("withoutSchools", () => {
  it("drops candidates that are a school's name", () => {
    expect(
      withoutSchools(
        ["Sam Houston", "Ty Pennington"],
        new Set(["sam houston"]),
      ),
    ).toEqual(["Ty Pennington"]);
  });
});

describe("namedAsStaff", () => {
  it("spots coaches and officials, with the role before or after the name", () => {
    expect(
      namedAsStaff("Cody Worley", "Furman hired head coach Cody Worley."),
    ).toBe(true);
    expect(
      namedAsStaff(
        "Michael Cross",
        "Michael Cross is stepping down as commissioner of the SoCon.",
      ),
    ).toBe(true);
  });

  it("leaves players alone, even near a coach", () => {
    expect(
      namedAsStaff(
        "Ty Pennington",
        "Ty Pennington threw a touchdown. He thanked his coach.",
      ),
    ).toBe(false);
    expect(
      namedAsStaff("Rickey Bradley Jr.", "Rickey Bradley Jr. scored 20."),
    ).toBe(false);
  });
});
