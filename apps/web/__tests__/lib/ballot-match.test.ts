import {
  ABSENT_RANK,
  type ConsensusRank,
  computeBallotMatchPercent,
  MAX_FOOTRULE_ERROR,
} from "@/lib/ballot-match";

function consensusOf(ids: string[]): ConsensusRank[] {
  return ids.map((id, i) => ({ id, rank: i + 1 }));
}

const TOP_25_IDS = Array.from({ length: 25 }, (_, i) => `team-${i + 1}`);

describe("computeBallotMatchPercent", () => {
  it("returns 100 for a perfect match", () => {
    expect(computeBallotMatchPercent(TOP_25_IDS, consensusOf(TOP_25_IDS))).toBe(
      100,
    );
  });

  it("returns 0 when every consensus team is absent", () => {
    const otherIds = Array.from({ length: 25 }, (_, i) => `other-${i + 1}`);
    expect(computeBallotMatchPercent(otherIds, consensusOf(TOP_25_IDS))).toBe(
      0,
    );
  });

  it("scores a near-miss (adjacent swap) high but below 100", () => {
    const swapped = [...TOP_25_IDS];
    const first = swapped[0]!;
    const second = swapped[1]!;
    swapped[0] = second;
    swapped[1] = first;

    const percent = computeBallotMatchPercent(swapped, consensusOf(TOP_25_IDS));

    // Adjacent swap: |2-1| + |1-2| = 2 → (1 - 2/325) ≈ 99%
    expect(percent).toBe(99);
    expect(percent).toBeLessThan(100);
  });

  it("lowers the score when one consensus team is omitted", () => {
    const perfect = computeBallotMatchPercent(
      TOP_25_IDS,
      consensusOf(TOP_25_IDS),
    );
    const omitFirst = ["outsider", ...TOP_25_IDS.slice(1)];
    const omittedFirst = computeBallotMatchPercent(
      omitFirst,
      consensusOf(TOP_25_IDS),
    );
    // team-1 absent → |26-1| = 25 → (1 - 25/325)*100 ≈ 92%
    expect(omittedFirst).toBe(92);
    expect(omittedFirst).toBeLessThan(perfect);
  });

  it("scores ties against the published consensus rank", () => {
    const consensus: ConsensusRank[] = TOP_25_IDS.map((id, i) => ({
      id,
      rank: i + 1,
    }));
    consensus[4] = { id: "team-5", rank: 5 };
    consensus[5] = { id: "team-6", rank: 5 };
    consensus[6] = { id: "team-7", rank: 7 };

    const inOrder = computeBallotMatchPercent(TOP_25_IDS, consensus);

    const moved = TOP_25_IDS.filter((id) => id !== "team-6");
    moved.push("team-6");
    const far = computeBallotMatchPercent(moved, consensus);

    expect(far).toBeLessThan(inOrder);
    expect(far).toBeLessThan(100);
  });

  it("returns 0 for empty consensus", () => {
    expect(computeBallotMatchPercent(TOP_25_IDS, [])).toBe(0);
  });

  it("exposes ABSENT_RANK and MAX_FOOTRULE_ERROR used by the formula", () => {
    expect(ABSENT_RANK).toBe(26);
    expect(MAX_FOOTRULE_ERROR).toBe(325);
  });
});
