import { describe, expect, it } from "vitest";

import {
  ballotMatrixColumnModeQueryValue,
  ballotMatrixShowPtsFirstColumns,
  ballotMatrixShowVoterColumns,
  parseBallotMatrixColumnMode,
  voterHasOutlierByIndex,
} from "@/lib/ballots-matrix-filters";
import type { BallotsPageMatrix } from "@/lib/ballots-page-data";

function matrixFixture(): BallotsPageMatrix {
  return {
    voters: [
      { userId: "a", slug: "a", label: "A", shortLabel: "A" },
      { userId: "b", slug: "b", label: "B", shortLabel: "B" },
    ],
    rows: [
      {
        teamId: "t1",
        name: "Team 1",
        shortName: "T1",
        abbreviation: "T1",
        image: null,
        publishedRank: 1,
        points: 100,
        firstPlaceVotes: 5,
        isReceivingVotesOnly: false,
        ballotsOn: 2,
        rankMin: 1,
        rankMax: 2,
        cells: [
          { rank: 1, isOutlier: false, isLeftOff: false },
          { rank: 10, isOutlier: true, isLeftOff: false },
        ],
      },
    ],
    ballotsCounted: 2,
    panelSize: 2,
    unanimousTeamCount: 0,
    topFirstPlaceVotes: 5,
    outlierPickCount: 1,
    leftOffCount: 0,
  };
}

describe("parseBallotMatrixColumnMode", () => {
  it("defaults to all", () => {
    expect(parseBallotMatrixColumnMode(null)).toBe("all");
  });

  it("maps legacy compact to summary", () => {
    expect(parseBallotMatrixColumnMode("compact")).toBe("summary");
  });

  it("parses on-range", () => {
    expect(parseBallotMatrixColumnMode("on-range")).toBe("on-range");
  });

  it("ignores unknown values", () => {
    expect(parseBallotMatrixColumnMode("nope")).toBe("all");
  });
});

describe("ballotMatrixColumnModeQueryValue", () => {
  it("omits all mode from the query string", () => {
    expect(ballotMatrixColumnModeQueryValue("all")).toBeNull();
    expect(ballotMatrixColumnModeQueryValue("summary")).toBe("summary");
  });
});

describe("ballot matrix column visibility", () => {
  it("summary hides voters but keeps pts/1st", () => {
    expect(ballotMatrixShowVoterColumns("summary")).toBe(false);
    expect(ballotMatrixShowPtsFirstColumns("summary")).toBe(true);
  });

  it("on-range hides voters and pts/1st", () => {
    expect(ballotMatrixShowVoterColumns("on-range")).toBe(false);
    expect(ballotMatrixShowPtsFirstColumns("on-range")).toBe(false);
  });
});

describe("voterHasOutlierByIndex", () => {
  it("marks only voters with at least one outlier cell", () => {
    expect(voterHasOutlierByIndex(matrixFixture())).toEqual([false, true]);
  });

  it("ignores a voter whose only flag is a left-off Top 25 team", () => {
    const matrix = matrixFixture();
    const row = matrix.rows[0];
    if (!row) {
      throw new Error("missing row");
    }
    row.cells[1] = { rank: null, isOutlier: false, isLeftOff: true };
    expect(voterHasOutlierByIndex(matrix)).toEqual([false, false]);
  });
});
