import { render, screen } from "@testing-library/react";

import { BallotsByVoterPanel } from "@/components/rankings/ballots-by-voter-panel";
import type { VoterBallotCardData } from "@/lib/ballots-by-voter-data";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const card: VoterBallotCardData = {
  userId: "u1",
  slug: "ada-voter",
  name: "Ada Voter",
  organization: "College Sports Journal",
  organizationRole: "Writer",
  matchPercent: 84,
  avgGap: 2.1,
  outlierCount: 1,
  consensusTop25Count: 21,
  numberOneShortName: "Tarleton State",
  omittedTop25: [],
  picks: [
    {
      teamId: "t1",
      name: "South Dakota State Jackrabbits",
      shortName: "South Dakota State",
      abbreviation: "SDSU",
      image: null,
      voterRank: 1,
      consensusRank: 1,
      diff: "equal",
      isOutlier: false,
    },
  ],
};

describe("BallotsByVoterPanel", () => {
  it("clips each voter card so a long team name cannot widen the page", () => {
    render(
      <BallotsByVoterPanel
        cards={[card]}
        ballotsHref="/ballots"
        byVoterPath="/ballots/by-voter"
      />,
    );

    expect(document.getElementById("ada-voter")).toHaveClass(
      "overflow-x-clip",
      "min-w-0",
    );
    expect(
      screen.getByRole("list", { name: "Ada Voter full ballot" }),
    ).toHaveClass("min-w-0");
    expect(screen.queryByText(/No\. 1:/)).not.toBeInTheDocument();
  });
});
