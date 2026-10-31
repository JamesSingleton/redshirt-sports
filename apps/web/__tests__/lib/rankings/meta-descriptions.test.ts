import {
  rankingsBallotsByVoterMetaDescription,
  rankingsBallotsMetaDescription,
  rankingsHistoryMetaDescription,
  rankingsVotersMetaDescription,
  sportRankingsHubMetaDescription,
} from "@/lib/rankings/meta-descriptions";

describe("rankings meta descriptions", () => {
  it("builds hub, voters, history, and ballot copy", () => {
    expect(sportRankingsHubMetaDescription("College Football")).toContain(
      "College Football",
    );
    expect(rankingsVotersMetaDescription("College Football", "FBS")).toContain(
      "FBS",
    );
    expect(rankingsHistoryMetaDescription("College Football", "FBS")).toContain(
      "poll history",
    );
    expect(
      rankingsBallotsMetaDescription(
        "College Football",
        "FBS",
        "Week 5",
        "2026",
      ),
    ).toContain("Week 5");
    expect(
      rankingsBallotsByVoterMetaDescription(
        "College Football",
        "FBS",
        "Week 5",
        "2026",
      ),
    ).toContain("Each voter");
  });
});
