import { describe, expect, it } from "vitest";

import { describeBallotPickContext } from "@/lib/ballot-pick-context";
import type { BallotPickRow } from "@/lib/ballots-by-voter-data";

function pick(overrides: Partial<BallotPickRow>): BallotPickRow {
  return {
    teamId: "t1",
    name: "Team",
    shortName: "Team",
    abbreviation: "TM",
    image: null,
    voterRank: 5,
    consensusRank: 5,
    diff: "equal",
    isOutlier: false,
    ...overrides,
  };
}

describe("describeBallotPickContext", () => {
  it("describes teams outside the published top 25", () => {
    expect(
      describeBallotPickContext(pick({ voterRank: 3, consensusRank: 30 })),
    ).toContain("not in the published Top 25");
    expect(
      describeBallotPickContext(pick({ voterRank: 1, consensusRank: 26 })),
    ).toContain("not in the published Top 25");
    expect(
      describeBallotPickContext(
        pick({ voterRank: 3, consensusRank: null, diff: "rv" }),
      ),
    ).toContain("not in the published Top 25");
    expect(
      describeBallotPickContext(
        pick({ voterRank: 25, consensusRank: 28, diff: "rv" }),
      ),
    ).not.toContain("Outlier");
    expect(
      describeBallotPickContext(
        pick({
          voterRank: 25,
          consensusRank: 34,
          diff: "rv",
          isOutlier: true,
        }),
      ),
    ).toContain("Outlier: 9 spots");
    expect(
      describeBallotPickContext(
        pick({
          voterRank: 25,
          consensusRank: null,
          diff: "rv",
          isOutlier: true,
        }),
      ),
    ).toContain("Outlier: 8 or more spots");
  });

  it("describes equal and numeric diffs", () => {
    expect(describeBallotPickContext(pick({ diff: "equal" }))).toContain(
      "Same position",
    );
    expect(
      describeBallotPickContext(
        pick({ voterRank: 3, consensusRank: 8, diff: 5 }),
      ),
    ).toContain("5 spots higher");
    expect(
      describeBallotPickContext(
        pick({ voterRank: 10, consensusRank: 5, diff: -5 }),
      ),
    ).toContain("5 spots lower");
    expect(
      describeBallotPickContext(
        pick({ voterRank: 9, consensusRank: 10, diff: 1 }),
      ),
    ).toContain("1 spot higher");
    expect(
      describeBallotPickContext(
        pick({ voterRank: 7, consensusRank: 6, diff: -1 }),
      ),
    ).toContain("1 spot lower");
  });

  it("notes outlier picks", () => {
    expect(
      describeBallotPickContext(
        pick({
          voterRank: 2,
          consensusRank: 12,
          diff: 10,
          isOutlier: true,
        }),
      ),
    ).toContain("Outlier");
    expect(
      describeBallotPickContext(
        pick({
          isOutlier: true,
          voterRank: 5,
          consensusRank: 10,
          diff: -5,
        }),
      ),
    ).toContain("Outlier pick under our ballot policy");
    expect(
      describeBallotPickContext(
        pick({
          isOutlier: true,
          voterRank: 5,
          consensusRank: 10,
          diff: 5,
        }),
      ),
    ).toContain("Outlier pick under our ballot policy");
    expect(
      describeBallotPickContext(
        pick({ voterRank: 5, consensusRank: 8, diff: "rv", isOutlier: false }),
      ),
    ).toContain("published at No. 8");
  });
});
