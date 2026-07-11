import { describe, expect, it } from "vitest";

import { mapNewsDivisionToRankingDivision } from "@/lib/college-news-config";

describe("mapNewsDivisionToRankingDivision", () => {
  it("maps football news divisions to ranking divisions", () => {
    expect(mapNewsDivisionToRankingDivision("football", "fbs")).toBe("fbs");
    expect(mapNewsDivisionToRankingDivision("football", "fcs")).toBe("fcs");
    expect(mapNewsDivisionToRankingDivision("football", "d2")).toBeNull();
  });

  it("maps basketball subgroupings to division-i rankings", () => {
    expect(
      mapNewsDivisionToRankingDivision("mens-basketball", "power-conference"),
    ).toBe("division-i");
    expect(
      mapNewsDivisionToRankingDivision("mens-basketball", "mid-major"),
    ).toBe("division-i");
    expect(
      mapNewsDivisionToRankingDivision("womens-basketball", "mid-major"),
    ).toBe("division-i");
    expect(
      mapNewsDivisionToRankingDivision("mens-basketball", "d2"),
    ).toBeNull();
  });
});
