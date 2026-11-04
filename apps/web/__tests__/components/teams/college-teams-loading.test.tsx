import { render, screen } from "@testing-library/react";

import CollegeTeamsLoading from "@/components/teams/college-teams-loading";

describe("CollegeTeamsLoading", () => {
  it("renders an accessible loading state", () => {
    render(<CollegeTeamsLoading />);
    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
  });
});
