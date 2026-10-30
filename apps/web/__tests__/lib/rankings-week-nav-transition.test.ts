import { rankingsWeekNavTransitionTypes } from "@/lib/rankings-week-nav-transition";

describe("rankingsWeekNavTransitionTypes", () => {
  it("returns lateral when the route week is missing", () => {
    expect(rankingsWeekNavTransitionTypes(undefined, "2")).toEqual([
      "nav-lateral",
    ]);
  });

  it("returns forward when moving to a later week", () => {
    expect(rankingsWeekNavTransitionTypes("1", "final-rankings")).toEqual([
      "nav-forward",
    ]);
  });

  it("returns back when moving to an earlier week", () => {
    expect(rankingsWeekNavTransitionTypes("2", "1")).toEqual(["nav-back"]);
  });

  it("returns lateral when the segment matches the current week", () => {
    expect(rankingsWeekNavTransitionTypes("1", "1")).toEqual(["nav-lateral"]);
  });

  it("returns lateral when parsing fails", () => {
    expect(rankingsWeekNavTransitionTypes("not-a-week", "1")).toEqual([
      "nav-lateral",
    ]);
  });
});
