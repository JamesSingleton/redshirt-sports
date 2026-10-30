import { render, screen } from "@testing-library/react";

vi.mock("@/components/home/home-page-skeleton", () => ({
  __esModule: true,
  default: () => <div data-testid="home-skeleton">Loading home</div>,
}));

import HomeRouteLoading from "@/app/home-route-loading";

describe("HomeRouteLoading", () => {
  it("renders the home page skeleton", () => {
    render(<HomeRouteLoading />);
    expect(screen.getByTestId("home-skeleton")).toBeInTheDocument();
  });
});
