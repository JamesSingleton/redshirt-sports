import { render, screen, within } from "@testing-library/react";

import { RankingsVotersPanel } from "@/components/rankings/rankings-voters-panel";

describe("RankingsVotersPanel", () => {
  it("keeps a long outlet name inside the mobile column", () => {
    render(
      <RankingsVotersPanel
        voters={[
          {
            id: "v1",
            name: "Ada Voter",
            organization: "Grizzly Sports Network International Desk",
            organizationRole: "Host and Sideline Reporter",
            voterSinceLabel: "2026",
            ballotsSubmittedLabel: "7",
            totalBallotsLabel: "7",
            latestBallotHref: "/ballot",
          },
        ]}
        seasonYear={2026}
        divisionName="FCS"
        ballotsSubmittedLabel="7 / 1"
        outletCount={1}
        methodologyHref="/rankings/methodology"
      />,
    );

    const list = screen.getByRole("list");
    expect(list).toHaveClass("min-w-0", "grid-cols-1");
    const card = screen.getByRole("listitem");
    expect(card).toHaveClass("flex", "min-w-0", "overflow-x-clip");
    expect(
      within(card).getByRole("link", { name: "Ballot" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Sort voters" })).toBeNull();
    expect(list.parentElement).toHaveClass(
      "grid-cols-1",
      "min-w-0",
      "overflow-x-clip",
    );
    expect(list.parentElement?.querySelector(".overflow-x-auto")).toHaveClass(
      "min-w-0",
      "w-full",
    );
  });
});
