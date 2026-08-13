import { render, screen } from "@testing-library/react";

vi.mock("@/components/home/home-page-skeleton", () => ({
  __esModule: true,
  default: () => <div data-testid="home-skeleton">Loading home</div>,
}));

import Loading from "@/app/loading";

describe("RootLoading", () => {
  it("renders the home page skeleton", () => {
    render(<Loading />);
    expect(screen.getByTestId("home-skeleton")).toBeInTheDocument();
  });
});
