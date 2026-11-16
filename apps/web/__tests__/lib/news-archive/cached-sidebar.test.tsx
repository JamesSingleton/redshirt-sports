import { render, screen } from "@testing-library/react";

vi.mock("@/components/live-ad-slot", () => ({
  LiveAdSlot: ({
    placement,
    sportSlugs = [],
  }: {
    placement: string;
    sportSlugs?: string[];
  }) => (
    <div
      data-testid="live-ad-slot"
      data-placement={placement}
      data-sports={sportSlugs.join(",")}
    />
  ),
}));

vi.mock("@/components/rankings-widget-slot", () => ({
  RankingsWidgetSlot: ({ sport = "football" }: { sport?: string }) => (
    <div data-testid="rankings-widget-slot" data-sport={sport} />
  ),
}));

import { NewsArchiveSidebarSlot } from "@/lib/news-archive/cached-sidebar";

describe("news archive sidebar", () => {
  it("shows the sport's rankings and sponsorship on a sport archive", () => {
    render(
      <NewsArchiveSidebarSlot
        sportSlug="mens-basketball"
        perspective="published"
        stega={false}
      />,
    );

    expect(screen.getByTestId("rankings-widget-slot")).toHaveAttribute(
      "data-sport",
      "mens-basketball",
    );
    const ad = screen.getByTestId("live-ad-slot");
    expect(ad).toHaveAttribute("data-placement", "news-sidebar");
    expect(ad).toHaveAttribute("data-sports", "mens-basketball");
  });

  it("falls back to football rankings on the all-sports archive", () => {
    render(
      <NewsArchiveSidebarSlot
        sportSlug={null}
        perspective="published"
        stega={false}
      />,
    );

    expect(screen.getByTestId("rankings-widget-slot")).toHaveAttribute(
      "data-sport",
      "football",
    );
    expect(screen.getByTestId("live-ad-slot")).toHaveAttribute(
      "data-sports",
      "",
    );
  });
});
