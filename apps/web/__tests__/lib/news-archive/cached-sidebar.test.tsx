import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

const { mockGetCachedRankingsWidgetPolls } = vi.hoisted(() => ({
  mockGetCachedRankingsWidgetPolls: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/rankings-widget-data", () => ({
  getCachedRankingsWidgetPolls: mockGetCachedRankingsWidgetPolls,
}));

vi.mock("@/components/news/news-archive-sidebar", () => ({
  NewsArchiveSidebar: () => <aside data-testid="sidebar" />,
}));

import {
  CachedNewsArchiveSidebarInner,
  NewsArchiveSidebarSlot,
} from "@/lib/news-archive/cached-sidebar";

describe("cached news archive sidebar", () => {
  it("renders the sidebar after deferred data loads", async () => {
    const tree = await CachedNewsArchiveSidebarInner({
      sportSlug: "football",
      perspective: "published",
      stega: false,
    });

    render(tree as ReactElement);
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("shows a skeleton fallback while the slot loads", () => {
    mockGetCachedRankingsWidgetPolls.mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <NewsArchiveSidebarSlot
        sportSlug="football"
        perspective="published"
        stega={false}
      />,
    );

    expect(
      container.querySelector('[data-slot="skeleton"]'),
    ).toBeInTheDocument();
  });
});
