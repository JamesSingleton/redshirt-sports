import {
  buildRankBySchoolId,
  displayName,
  getDroppedFromVotes,
  getDroppedOutOfTop25,
  getMovement,
  getPreviousWeek,
  type RankingTeamRef,
} from "@/lib/rankings-movement";

const team = (
  id: string,
  rank: number | null,
  points = 100,
  shortName = id,
): RankingTeamRef => ({
  _id: id,
  rank,
  _points: points,
  shortName,
});

describe("getPreviousWeek", () => {
  const weeks = [{ week: 0 }, { week: 1 }, { week: 2 }, { week: 999 }];

  it("returns the prior week in the list", () => {
    expect(getPreviousWeek(weeks, 2)).toBe(1);
    expect(getPreviousWeek(weeks, 999)).toBe(2);
    expect(getPreviousWeek(weeks, 1)).toBe(0);
  });

  it("returns undefined for the first week or unknown week", () => {
    expect(getPreviousWeek(weeks, 0)).toBeUndefined();
    expect(getPreviousWeek(weeks, 50)).toBeUndefined();
    expect(getPreviousWeek([], 1)).toBeUndefined();
  });
});

describe("buildRankBySchoolId", () => {
  it("maps school ids to ranks", () => {
    const map = buildRankBySchoolId([
      team("a", 1),
      team("b", null),
      team("c", 26),
    ]);
    expect(map.get("a")).toBe(1);
    expect(map.get("b")).toBeNull();
    expect(map.get("c")).toBe(26);
  });
});

describe("getMovement", () => {
  it("reports up when rank improves", () => {
    expect(getMovement(3, 7)).toEqual({ kind: "up", delta: 4 });
  });

  it("reports down when rank worsens", () => {
    expect(getMovement(10, 5)).toEqual({ kind: "down", delta: 5 });
  });

  it("reports same when rank is unchanged", () => {
    expect(getMovement(4, 4)).toEqual({ kind: "same" });
  });

  it("reports NR when previous was outside Top 25 or missing", () => {
    expect(getMovement(20, 26)).toEqual({ kind: "nr" });
    expect(getMovement(20, null)).toEqual({ kind: "nr" });
    expect(getMovement(20, undefined)).toEqual({ kind: "nr" });
  });

  it("reports NR when current is not Top 25", () => {
    expect(getMovement(26, 10)).toEqual({ kind: "nr" });
    expect(getMovement(null, 10)).toEqual({ kind: "nr" });
  });
});

describe("getDroppedFromVotes", () => {
  it("returns teams with prior points that are absent this week", () => {
    const previous = [team("a", 1), team("b", 26, 12), team("c", null, 0)];
    const current = [team("a", 2)];
    expect(getDroppedFromVotes(previous, current).map((t) => t._id)).toEqual([
      "b",
    ]);
  });
});

describe("getDroppedOutOfTop25", () => {
  it("returns prior Top 25 teams that are no longer ranked in Top 25", () => {
    const previous = [
      team("stay", 5),
      team("to-orv", 24, 40, "Youngstown State"),
      team("gone", 18, 50, "Mercer"),
      team("was-orv", 26, 10),
    ];
    const current = [
      team("stay", 4),
      team("to-orv", null, 12, "Youngstown State"),
    ];

    expect(getDroppedOutOfTop25(previous, current)).toEqual([
      expect.objectContaining({
        _id: "gone",
        previousRank: 18,
        shortName: "Mercer",
      }),
      expect.objectContaining({
        _id: "to-orv",
        previousRank: 24,
        shortName: "Youngstown State",
      }),
    ]);
  });

  it("returns empty when there are no dropouts", () => {
    const previous = [team("a", 1), team("b", 2)];
    const current = [team("a", 2), team("b", 1)];
    expect(getDroppedOutOfTop25(previous, current)).toEqual([]);
  });
});

describe("displayName", () => {
  it("prefers shortName then abbreviation then name", () => {
    expect(displayName(team("x", 1, 1, "Montana"))).toBe("Montana");
    expect(
      displayName({
        _id: "x",
        rank: 1,
        _points: 1,
        abbreviation: "MON",
        name: "Montana State",
      }),
    ).toBe("MON");
    expect(
      displayName({
        _id: "x",
        rank: 1,
        _points: 1,
        name: "Montana State",
      }),
    ).toBe("Montana State");
  });

  it("falls back to Unknown when no name fields exist", () => {
    expect(
      displayName({
        _id: "x",
        rank: 1,
        _points: 1,
      }),
    ).toBe("Unknown");
  });
});
