import { render, screen } from "@testing-library/react";

import { RankMovement } from "@/components/rankings/rank-movement";

describe("RankMovement", () => {
  it("renders up movement with delta and aria-label", () => {
    render(<RankMovement movement={{ kind: "up", delta: 3 }} />);
    expect(screen.getByLabelText("Up 3")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders down movement with delta and aria-label", () => {
    render(<RankMovement movement={{ kind: "down", delta: 2 }} />);
    expect(screen.getByLabelText("Down 2")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders unchanged as an em dash", () => {
    render(<RankMovement movement={{ kind: "same" }} />);
    expect(screen.getByLabelText("No change")).toBeInTheDocument();
  });

  it("renders NR for new-to-rankings", () => {
    render(<RankMovement movement={{ kind: "nr" }} />);
    expect(screen.getByLabelText("Newly ranked")).toHaveTextContent("NEW");
  });
});
