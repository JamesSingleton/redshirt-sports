import { TabsList, TabsTrigger } from "@redshirt-sports/ui/components/tabs";
import { fireEvent, render, screen } from "@testing-library/react";

import {
  TransitionTabs,
  TransitionTabsPanel,
} from "@/components/rankings/transition-tabs";

describe("TransitionTabs", () => {
  it("shows the default panel and swaps panels when a tab is chosen", async () => {
    render(
      <TransitionTabs defaultValue="fcs">
        <TabsList>
          <TabsTrigger value="fcs">FCS</TabsTrigger>
          <TabsTrigger value="fbs">FBS</TabsTrigger>
        </TabsList>
        <TransitionTabsPanel value="fcs">FCS panel</TransitionTabsPanel>
        <TransitionTabsPanel value="fbs">FBS panel</TransitionTabsPanel>
      </TransitionTabs>,
    );

    expect(screen.getByRole("tab", { name: "FCS" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("FCS panel")).toBeVisible();

    fireEvent.click(screen.getByRole("tab", { name: "FBS" }));

    expect(await screen.findByText("FBS panel")).toBeVisible();
    expect(screen.getByRole("tab", { name: "FBS" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
