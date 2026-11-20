import { clearSlot, moveTeam, placeTeam } from "@/lib/ballot-order";

// Five slots stand in for 25; the rules don't depend on the length.
const full = ["a", "b", "c", "d", "e"];

describe("placeTeam", () => {
  it("fills an empty slot without moving anything", () => {
    expect(placeTeam(["a", "", "c"], 1, "x")).toEqual({
      ballot: ["a", "x", "c"],
    });
  });

  it("inserts into a filled slot and shifts picks down into the next gap", () => {
    expect(placeTeam(["a", "b", "c", "", "e"], 1, "x")).toEqual({
      ballot: ["a", "x", "b", "c", "e"],
    });
  });

  it("pushes the last pick off a full ballot", () => {
    expect(placeTeam(full, 0, "x")).toEqual({
      ballot: ["x", "a", "b", "c", "d"],
      dropped: "e",
    });
  });

  it("moves a school already on the ballot instead of duplicating it", () => {
    expect(placeTeam(full, 1, "d")).toEqual({
      ballot: ["a", "d", "b", "c", "e"],
    });
    expect(placeTeam(full, 3, "a")).toEqual({
      ballot: ["b", "c", "d", "a", "e"],
    });
  });

  it("leaves the ballot alone when the school is already in that slot", () => {
    expect(placeTeam(full, 2, "c")).toEqual({ ballot: full });
  });

  it("doesn't change the ballot it's given", () => {
    const ballot = [...full];
    placeTeam(ballot, 0, "x");
    expect(ballot).toEqual(full);
  });
});

describe("moveTeam", () => {
  it("slides the picks between to close the gap", () => {
    expect(moveTeam(full, 4, 1)).toEqual(["a", "e", "b", "c", "d"]);
    expect(moveTeam(["a", "", "c"], 0, 2)).toEqual(["", "c", "a"]);
  });
});

describe("clearSlot", () => {
  it("empties one slot and keeps the rest in place", () => {
    expect(clearSlot(full, 2)).toEqual(["a", "b", "", "d", "e"]);
  });
});
