import { render } from "@testing-library/react";

import { VoterBreakdownSkeleton } from "@/components/rankings/voter-breakdown-skeleton";

describe("VoterBreakdownSkeleton", () => {
  it("renders the loading skeleton layout", () => {
    const { container } = render(<VoterBreakdownSkeleton />);

    expect(container.querySelector(".animate-pulse")).toBeTruthy();
    expect(container.textContent).not.toContain("Voter Breakdown");
  });
});
