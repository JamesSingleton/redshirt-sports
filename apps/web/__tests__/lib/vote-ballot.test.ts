import {
  processBallotSanityIds,
  validateDivision,
  validateSport,
} from "@/lib/vote-ballot";

describe("processBallotSanityIds", () => {
  it("maps ranks to points from 25 down to 1", () => {
    const entries = processBallotSanityIds({
      rank_1: "a",
      rank_2: "b",
      rank_25: "z",
    });
    expect(entries).toEqual([
      { sanityId: "a", rank: 1, points: 25 },
      { sanityId: "b", rank: 2, points: 24 },
      { sanityId: "z", rank: 25, points: 1 },
    ]);
  });

  it("skips missing ranks", () => {
    expect(processBallotSanityIds({ rank_3: "c" })).toEqual([
      { sanityId: "c", rank: 3, points: 23 },
    ]);
  });

  it("returns empty array when no ranks are set", () => {
    expect(processBallotSanityIds({})).toEqual([]);
  });
});

describe("validateSport", () => {
  it("accepts known sport slugs", () => {
    expect(validateSport("football")).toBe("football");
    expect(validateSport("mens-basketball")).toBe("mens-basketball");
    expect(validateSport("womens-basketball")).toBe("womens-basketball");
  });

  it("throws for unknown sports", () => {
    expect(() => validateSport("baseball")).toThrow(/Invalid sport/);
  });
});

describe("validateDivision", () => {
  it("accepts known divisions", () => {
    expect(validateDivision("fbs")).toBe("fbs");
    expect(validateDivision("mid-major")).toBe("mid-major");
  });

  it("throws for unknown divisions", () => {
    expect(() => validateDivision("d1")).toThrow(/Invalid division/);
  });
});
