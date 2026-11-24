import { describe, expect, it } from "vitest";

import { duplicateTier, rankDuplicates } from "./duplicates";

const match = (similarity: number, overrides = {}) => ({
  similarity,
  sportIds: ["football"],
  currentSchoolIds: ["montana"],
  hsGradYear: 2022,
  ...overrides,
});

describe("duplicateTier", () => {
  it("calls a near-identical name likely on its own", () => {
    expect(duplicateTier(match(0.85), {})).toBe("likely");
  });

  it("needs sport plus school or class to call a looser name likely", () => {
    const sameSchool = { sportId: "football", schoolId: "montana" };
    expect(duplicateTier(match(0.55), sameSchool)).toBe("likely");
    expect(
      duplicateTier(match(0.55), { sportId: "football", hsGradYear: 2022 }),
    ).toBe("likely");
    // Same school, other sport: a namesake.
    expect(duplicateTier(match(0.55), { ...sameSchool, sportId: "wbb" })).toBe(
      "possible",
    );
    expect(duplicateTier(match(0.55), {})).toBe("possible");
  });

  it("shows a weak name only when the context agrees", () => {
    expect(duplicateTier(match(0.35), {})).toBeNull();
    expect(
      duplicateTier(match(0.35), { sportId: "football", schoolId: "montana" }),
    ).toBe("possible");
  });
});

describe("rankDuplicates", () => {
  it("puts likely matches first, drops hidden ones, and stops at the limit", () => {
    const ranked = rankDuplicates(
      [
        { id: 1, ...match(0.6) },
        { id: 2, ...match(0.9) },
        { id: 3, ...match(0.31) },
        { id: 4, ...match(0.55, { sportIds: ["mbb"] }) },
      ],
      { sportId: "football", schoolId: "montana" },
      3,
    );
    expect(ranked.map((row) => [row.id, row.tier])).toEqual([
      [2, "likely"],
      [1, "likely"],
      // Another sport: shown, but doesn't stop the save.
      [4, "possible"],
    ]);
  });
});
