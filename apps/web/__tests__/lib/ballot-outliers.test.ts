import { describe, expect, it } from "vitest";

import { isOutlierPick, rankHeatCellClass } from "@/lib/ballot-outliers";

describe("isOutlierPick", () => {
  it("flags ≥8-spot gap vs published rank (including RV teams in the poll)", () => {
    expect(isOutlierPick({ voterRank: 20, publishedRank: 28 })).toBe(true);
    expect(isOutlierPick({ voterRank: 22, publishedRank: 30 })).toBe(true);
  });

  it("does not treat RV picks as gap outliers when published rank is unknown", () => {
    expect(isOutlierPick({ voterRank: 20, publishedRank: null })).toBe(false);
  });

  it("counts omitting any published Top 25 team as an outlier", () => {
    expect(isOutlierPick({ voterRank: null, publishedRank: 10 })).toBe(true);
    expect(isOutlierPick({ voterRank: null, publishedRank: 16 })).toBe(true);
    expect(isOutlierPick({ voterRank: null, publishedRank: 25 })).toBe(true);
    expect(isOutlierPick({ voterRank: null, publishedRank: 26 })).toBe(false);
  });
});

describe("rankHeatCellClass", () => {
  it("returns tiered heat classes by rank", () => {
    expect(rankHeatCellClass(1)).toContain("heat-1");
    expect(rankHeatCellClass(8)).toContain("heat-2");
    expect(rankHeatCellClass(12)).toContain("heat-3");
    expect(rankHeatCellClass(18)).toContain("heat-4");
    expect(rankHeatCellClass(22)).toContain("heat-5");
    expect(rankHeatCellClass(30)).toContain("heat-rv");
  });
});
