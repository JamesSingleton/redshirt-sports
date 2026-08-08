import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@redshirt-sports/ui/components/card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  CardContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

import RankingsLoading from "@/app/college/[sport]/rankings/[division]/[year]/[week]/loading";

describe("RankingsLoading", () => {
  it("renders skeleton placeholders", () => {
    const { container } = render(<RankingsLoading />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      5,
    );
    expect(screen.getByText).toBeDefined();
  });
});
