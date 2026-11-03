import { describe, expect, it } from "vitest";

import {
  divisionWinLoss,
  formatWinLoss,
  headToHead,
  type SeasonGameRow,
  teamResults,
  winLoss,
} from "./matchup";

function game(overrides: Partial<SeasonGameRow>): SeasonGameRow {
  return {
    id: "g",
    kickoffAt: null,
    homeSchoolId: null,
    awaySchoolId: null,
    homeName: "Home Team",
    awayName: "Away Team",
    homeShortName: null,
    awayShortName: null,
    homeLevel: "FCS",
    awayLevel: "FCS",
    homeScore: 0,
    awayScore: 0,
    neutralSite: false,
    overtime: false,
    ...overrides,
  };
}

const games: SeasonGameRow[] = [
  game({
    id: "late",
    kickoffAt: new Date("2026-10-03T19:00:00Z"),
    homeSchoolId: "ilst",
    awaySchoolId: "sdsu",
    homeShortName: "Illinois State",
    awayShortName: "South Dakota State",
    homeScore: 14,
    awayScore: 31,
  }),
  game({
    id: "early",
    kickoffAt: new Date("2026-09-05T19:00:00Z"),
    homeSchoolId: "sdsu",
    homeName: "South Dakota State Jackrabbits",
    awayName: "Northwestern Wildcats",
    awayLevel: "FBS",
    homeScore: 17,
    awayScore: 24,
    overtime: true,
  }),
  game({
    id: "neutral",
    kickoffAt: null,
    homeSchoolId: "x",
    awaySchoolId: "sdsu",
    homeScore: 10,
    awayScore: 20,
    neutralSite: true,
  }),
  game({ id: "unplayed", homeSchoolId: "sdsu", homeScore: null }),
];

describe("teamResults", () => {
  it("turns final games into one team's results, oldest first", () => {
    const results = teamResults("sdsu", games);
    expect(results.map((result) => result.gameId)).toEqual([
      "neutral",
      "early",
      "late",
    ]);
    expect(results[1]).toMatchObject({
      opponentName: "Northwestern Wildcats",
      opponentLevel: "FBS",
      site: "home",
      teamScore: 17,
      opponentScore: 24,
      won: false,
      overtime: true,
    });
    expect(results[2]).toMatchObject({
      opponentSchoolId: "ilst",
      opponentName: "Illinois State",
      site: "away",
      won: true,
    });
    expect(results[0]?.site).toBe("neutral");
  });

  it("uses the short name when there is one", () => {
    expect(teamResults("ilst", games)[0]?.opponentName).toBe(
      "South Dakota State",
    );
  });
});

describe("records", () => {
  const results = teamResults("sdsu", games);

  it("counts wins and losses, overall and against FCS", () => {
    expect(winLoss(results)).toEqual({ wins: 2, losses: 1 });
    expect(divisionWinLoss(results)).toEqual({ wins: 2, losses: 0 });
    expect(formatWinLoss(winLoss(results))).toBe("2-1");
  });

  it("finds head-to-head games", () => {
    expect(
      headToHead({ results }, "ilst").map((result) => result.gameId),
    ).toEqual(["late"]);
    expect(headToHead({ results }, "nobody")).toEqual([]);
  });
});
