import { render, screen } from "@testing-library/react";

import { TeamPageSkeleton } from "@/components/teams/team-page-skeleton";

describe("TeamPageSkeleton", () => {
  it("announces loading to screen readers", () => {
    render(<TeamPageSkeleton />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading team…");
    expect(
      screen.getByRole("status").closest("[aria-busy='true']"),
    ).toBeInTheDocument();
  });
});
