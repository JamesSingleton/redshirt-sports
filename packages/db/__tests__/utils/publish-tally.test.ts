import { describe, expect, it } from "vitest";

import { tallyTeamPoints, toRankingRows } from "../../src/utils/publish-tally";

describe("tallyTeamPoints", () => {
  it("sums points and first-place votes per school", () => {
    const tallied = tallyTeamPoints([
      { schoolId: "a", rank: 1, points: 25, userId: "u1" },
      { schoolId: "b", rank: 2, points: 24, userId: "u1" },
      { schoolId: "a", rank: 1, points: 25, userId: "u2" },
      { schoolId: "b", rank: 3, points: 23, userId: "u2" },
    ]);

    expect(tallied[0]).toMatchObject({
      schoolId: "a",
      totalPoints: 50,
      firstPlaceVotes: 2,
      rank: 1,
      isTie: false,
    });
    expect(tallied[1]).toMatchObject({
      schoolId: "b",
      totalPoints: 47,
      firstPlaceVotes: 0,
      rank: 2,
    });
  });

  it("breaks equal points with first-place votes", () => {
    const tallied = tallyTeamPoints([
      { schoolId: "a", rank: 2, points: 24, userId: "u1" },
      { schoolId: "b", rank: 1, points: 24, userId: "u2" },
    ]);

    expect(tallied[0]?.schoolId).toBe("b");
    expect(tallied[0]?.firstPlaceVotes).toBe(1);
    expect(tallied[1]?.schoolId).toBe("a");
  });

  it("marks ties when points and first-place votes match", () => {
    const tallied = tallyTeamPoints([
      { schoolId: "a", rank: 1, points: 25, userId: "u1" },
      { schoolId: "b", rank: 1, points: 25, userId: "u2" },
    ]);

    expect(tallied[0]?.isTie).toBe(true);
    expect(tallied[1]?.isTie).toBe(true);
    expect(tallied[0]?.rank).toBe(1);
    expect(tallied[1]?.rank).toBe(1);
  });

  it("skips votes without schoolId", () => {
    expect(tallyTeamPoints([{ rank: 1, points: 25, userId: "u1" }])).toEqual(
      [],
    );
  });
});

describe("toRankingRows", () => {
  it("keeps Top 25 ranks and preserves ORV ordinals above 25", () => {
    const rows = toRankingRows([
      {
        schoolId: "top",
        totalPoints: 100,
        firstPlaceVotes: 5,
        rank: 1,
        isTie: false,
      },
      {
        schoolId: "orv",
        totalPoints: 1,
        firstPlaceVotes: 0,
        rank: 26,
        isTie: false,
      },
    ]);

    expect(rows[0]).toEqual({
      schoolId: "top",
      rank: 1,
      points: 100,
      firstPlaceVotes: 5,
      isTie: false,
    });
    expect(rows[1]?.rank).toBe(26);
  });
});
