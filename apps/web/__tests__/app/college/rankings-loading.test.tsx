import { render, screen } from "@testing-library/react";

vi.mock("@/components/rankings/rankings-page-skeleton", () => ({
  __esModule: true,
  default: () => <div data-testid="rankings-skeleton">Loading rankings</div>,
}));

import Loading from "@/app/college/[sport]/rankings/[division]/[year]/[week]/loading";

describe("Rankings week loading", () => {
  it("renders the rankings page skeleton", () => {
    render(<Loading />);
    expect(screen.getByTestId("rankings-skeleton")).toBeInTheDocument();
  });
});
