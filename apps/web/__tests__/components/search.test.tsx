import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Search from "@/components/search";

const { mockPush, mockCapture } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockCapture: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@redshirt-sports/analytics", () => ({
  analytics: { capture: mockCapture },
}));

describe("Search", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockCapture.mockReset();
  });

  it("renders with the default value and placeholder", () => {
    render(<Search defaultValue="football" />);

    expect(screen.getByDisplayValue("football")).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toHaveAttribute(
      "placeholder",
      expect.stringContaining("Search"),
    );
  });

  it("debounces navigation and analytics when the query changes", async () => {
    const user = userEvent.setup();
    render(<Search />);

    await user.type(screen.getByRole("searchbox"), "alabama");

    await waitFor(
      () => {
        expect(mockCapture).toHaveBeenCalledWith("search_performed", {
          search_query: "alabama",
          query_length: 7,
        });
        expect(mockPush).toHaveBeenCalledWith("/search?q=alabama");
      },
      { timeout: 1500 },
    );
  });

  it("navigates to search without a query when input is cleared", async () => {
    const user = userEvent.setup();
    render(<Search defaultValue="test" />);

    await user.clear(screen.getByRole("searchbox"));

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith("/search");
      },
      { timeout: 1500 },
    );
    expect(mockCapture).not.toHaveBeenCalled();
  });
});
