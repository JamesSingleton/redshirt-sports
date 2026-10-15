import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AdSlot } from "./ad-slot";
import { ArchivePagination } from "./archive-pagination";
import { FollowButton } from "./follow-button";
import { MovementIndicator, RankingsTable } from "./rankings-table";
import { StoryCard } from "./story-card";

describe("editorial components", () => {
  it("renders story card variants", () => {
    render(
      <StoryCard
        variant="lead"
        href="/college/football/news/example"
        kicker="FCS"
        title="Example State wins"
        dek="A local example."
      />,
    );
    expect(
      screen.getByRole("link", { name: "Example State wins" }),
    ).toHaveAttribute("href", "/college/football/news/example");
    expect(screen.getByText("FCS").className).toContain("kicker");
  });

  it("labels rank movement with text", () => {
    render(
      <>
        <MovementIndicator movement="new" />
        <MovementIndicator movement={2} />
        <MovementIndicator movement={-1} />
      </>,
    );
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("Up 2")).toBeInTheDocument();
    expect(screen.getByText("Down 1")).toBeInTheDocument();
  });

  it("renders a rankings row", () => {
    render(
      <RankingsTable
        rows={[{ rank: 1, name: "Example State", points: 400, movement: 0 }]}
      />,
    );
    expect(screen.getByText("Example State")).toBeInTheDocument();
    expect(screen.getByText("Unchanged")).toBeInTheDocument();
  });

  it("reserves ad slot height", () => {
    render(<AdSlot size="rectangle" />);
    expect(screen.getByRole("complementary")).toHaveClass("min-h-[250px]");
  });

  it("paginates with real links and omits the query on page 1", () => {
    render(
      <ArchivePagination
        pathname="/college/football/news"
        page={2}
        pageCount={2}
      />,
    );
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/college/football/news");
    expect(links[1]).toHaveAttribute("href", "/college/football/news?page=2");
  });

  it("toggles follow without opening a dialog", async () => {
    const user = userEvent.setup();
    render(<FollowButton name="Example State" />);
    const button = screen.getByRole("button", { name: "Follow Example State" });
    await user.click(button);
    expect(
      screen.getByRole("button", { name: "Following Example State" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
