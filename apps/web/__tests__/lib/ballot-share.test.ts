import { describe, expect, it } from "vitest";

import { buildImageRows, buildPostText, diffLabel } from "@/lib/ballot-share";

describe("diffLabel", () => {
  it("formats a positive numeric diff as +n", () => {
    expect(diffLabel(3)).toBe("+3");
    expect(diffLabel(12)).toBe("+12");
  });

  it("formats a negative numeric diff as -n", () => {
    expect(diffLabel(-2)).toBe("-2");
    expect(diffLabel(-10)).toBe("-10");
  });

  it('returns "=" for equal', () => {
    expect(diffLabel("equal")).toBe("=");
  });

  it('returns "RV" for rv', () => {
    expect(diffLabel("rv")).toBe("RV");
  });
});

describe("buildImageRows", () => {
  it("maps picks to rows, keeping the card's outlier flag (including RV picks)", () => {
    const picks = [
      {
        voterRank: 1,
        shortName: "Montana",
        diff: "equal" as const,
        isOutlier: false,
      },
      { voterRank: 5, shortName: "NDSU", diff: 3, isOutlier: false },
      { voterRank: 10, shortName: "Kennesaw", diff: -10, isOutlier: true },
      {
        voterRank: 25,
        shortName: "Weber St",
        diff: "rv" as const,
        isOutlier: true,
      },
    ];
    const rows = buildImageRows(picks);

    expect(rows).toEqual([
      { rank: 1, teamName: "Montana", diffLabel: "=", isOutlier: false },
      { rank: 5, teamName: "NDSU", diffLabel: "+3", isOutlier: false },
      {
        rank: 10,
        teamName: "Kennesaw",
        diffLabel: "-10",
        isOutlier: true,
      },
      { rank: 25, teamName: "Weber St", diffLabel: "RV", isOutlier: true },
    ]);
  });
});

describe("buildPostText", () => {
  it("builds the exact post text format", () => {
    const result = buildPostText({
      week: 10,
      poll: "FCS",
      totalBallots: 42,
      url: "https://redshirtsports.xyz/college/football/rankings/fcs/2026/10/ballots/by-voter",
    });
    expect(result).toBe(
      "My Week 10 @_redshirtsports FCS Top 25 ballot. All 42 ballots: https://redshirtsports.xyz/college/football/rankings/fcs/2026/10/ballots/by-voter",
    );
  });

  it("works with FBS poll", () => {
    const result = buildPostText({
      week: 3,
      poll: "FBS",
      totalBallots: 15,
      url: "https://redshirtsports.xyz/college/football/rankings/fbs/2026/3/ballots/by-voter",
    });
    expect(result).toBe(
      "My Week 3 @_redshirtsports FBS Top 25 ballot. All 15 ballots: https://redshirtsports.xyz/college/football/rankings/fbs/2026/3/ballots/by-voter",
    );
  });
});
