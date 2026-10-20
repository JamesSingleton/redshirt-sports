import { describe, expect, it } from "vitest";

import { isOutlierPick } from "@/lib/ballot-outliers";

describe("isOutlierPick", () => {
  it("flags ≥8-spot gap vs published rank (including RV teams in the poll)", () => {
    expect(isOutlierPick({ voterRank: 20, publishedRank: 28 })).toBe(true);
    expect(isOutlierPick({ voterRank: 22, publishedRank: 30 })).toBe(true);
  });

  it("does not treat RV picks as gap outliers when published rank is unknown", () => {
    expect(isOutlierPick({ voterRank: 20, publishedRank: null })).toBe(false);
  });

  it("counts omitting a consensus top-15 team as an outlier", () => {
    expect(isOutlierPick({ voterRank: null, publishedRank: 10 })).toBe(true);
  });
});
