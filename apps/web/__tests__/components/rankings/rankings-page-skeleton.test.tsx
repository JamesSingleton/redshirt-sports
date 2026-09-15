import { render } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("@redshirt-sports/ui/components/card", () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import RankingsPageSkeleton from "@/components/rankings/rankings-page-skeleton";

describe("RankingsPageSkeleton", () => {
  it("renders skeleton placeholders", () => {
    const { container } = render(<RankingsPageSkeleton />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      5,
    );
  });
});
