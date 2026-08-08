import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TeamPlayerSearch } from "@/components/teams/team-player-search";

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("TeamPlayerSearch", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("does not navigate when the query is blank", async () => {
    const user = userEvent.setup();
    render(<TeamPlayerSearch />);

    await user.click(screen.getByRole("button", { name: "Search players" }));

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("navigates to search results when a query is submitted", async () => {
    const user = userEvent.setup();
    render(<TeamPlayerSearch />);

    await user.type(
      screen.getByPlaceholderText("Search players"),
      "  Caleb Downs ",
    );
    await user.click(screen.getByRole("button", { name: "Search players" }));

    expect(mockPush).toHaveBeenCalledWith("/search?q=Caleb%20Downs");
  });
});
