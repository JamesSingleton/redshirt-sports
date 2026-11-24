import { describe, expect, it, vi } from "vitest";

import {
  espnPlayerProfile,
  fetchEspnAthlete,
  parseEspnPlayerUrl,
} from "../athlete";

describe("parseEspnPlayerUrl", () => {
  it("reads the sport and id from a profile link", () => {
    expect(
      parseEspnPlayerUrl(
        "https://www.espn.com/college-football/player/_/id/5225414/ty-pennington",
      ),
    ).toEqual({ sport: "football", id: "5225414" });
    expect(
      parseEspnPlayerUrl(
        " https://espn.com/mens-college-basketball/player/_/id/5241292 ",
      ),
    ).toEqual({ sport: "mens-basketball", id: "5241292" });
    expect(
      parseEspnPlayerUrl(
        "https://www.espn.com/womens-college-basketball/player/stats/_/id/123/x?y=1",
      ),
    ).toEqual({ sport: "womens-basketball", id: "123" });
  });

  it("refuses pro leagues, bare numbers, and other sites", () => {
    expect(
      parseEspnPlayerUrl("https://www.espn.com/nfl/player/_/id/1/x"),
    ).toBeNull();
    expect(parseEspnPlayerUrl("5225414")).toBeNull();
    expect(
      parseEspnPlayerUrl("https://evil.test/college-football/player/_/id/1"),
    ).toBeNull();
  });
});

const athlete = {
  id: "5225414",
  firstName: "Ty",
  lastName: "Pennington",
  displayHeight: "6' 2\"",
  displayWeight: "220 lbs",
  displayBirthPlace: "Sand Springs, OK",
  displayExperience: "Senior",
  position: { abbreviation: "QB" },
  team: { id: "2464", displayName: "Northern Arizona Lumberjacks" },
};

describe("espnPlayerProfile", () => {
  it("maps height, weight, class, hometown, and team", () => {
    expect(espnPlayerProfile(athlete)).toEqual({
      espnId: "5225414",
      firstName: "Ty",
      lastName: "Pennington",
      suffix: "",
      hometownCity: "Sand Springs",
      hometownState: "OK",
      position: "QB",
      heightIn: 74,
      weightLb: 220,
      classCode: "SR",
      espnTeamId: "2464",
      teamName: "Northern Arizona Lumberjacks",
    });
  });

  it("splits a suffix off the last name and tolerates gaps", () => {
    const profile = espnPlayerProfile({
      id: "1",
      firstName: "Rickey",
      lastName: "Bradley Jr.",
      displayBirthPlace: "Toronto, Canada",
    });
    expect(profile).toMatchObject({
      lastName: "Bradley",
      suffix: "Jr.",
      hometownCity: "Toronto",
      hometownState: "",
      heightIn: null,
      weightLb: null,
      classCode: "",
      espnTeamId: null,
    });
  });
});

describe("fetchEspnAthlete", () => {
  it("reads the athlete from the sport's endpoint", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request) =>
      Response.json({ athlete: { ...athlete, extra: true } }),
    );
    const result = await fetchEspnAthlete("mens-basketball", "42", {
      fetchImpl,
      retries: 0,
    });
    expect(result.lastName).toBe("Pennington");
    expect(String(fetchImpl.mock.calls[0]![0])).toContain(
      "/basketball/mens-college-basketball/athletes/42",
    );
  });
});
