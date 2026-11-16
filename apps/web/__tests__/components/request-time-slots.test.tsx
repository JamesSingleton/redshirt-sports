import { render, screen } from "@testing-library/react";

const { mockConnection, mockLoadAdvertisement, mockPolls } = vi.hoisted(() => ({
  mockConnection: vi.fn().mockResolvedValue(undefined),
  mockLoadAdvertisement: vi.fn(),
  mockPolls: vi.fn(),
}));

vi.mock("next/server", () => ({ connection: mockConnection }));

vi.mock("@/lib/advertisement", () => ({
  loadAdvertisement: mockLoadAdvertisement,
}));

vi.mock("@/lib/rankings-widget-data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rankings-widget-data")>()),
  getCachedRankingsWidgetPolls: mockPolls,
}));

vi.mock("@/components/ad-slot", () => ({
  AdSlot: ({ creative }: { creative: { sponsorName: string } | null }) =>
    creative ? <div data-testid="ad">{creative.sponsorName}</div> : null,
}));

vi.mock("@/components/rankings-widget", () => ({
  RankingsWidget: ({ polls }: { polls: unknown[] }) => (
    <div data-testid="widget">{polls.length}</div>
  ),
}));

import { LiveAdSlot, RequestTimeAdSlot } from "@/components/live-ad-slot";
import {
  RankingsWidgetSlot,
  RequestTimeRankingsWidget,
} from "@/components/rankings-widget-slot";

const published = { perspective: "published", stega: false } as const;

describe("LiveAdSlot", () => {
  beforeEach(() => {
    mockConnection.mockClear();
    mockLoadAdvertisement.mockReset();
  });

  it("waits for a request before choosing a sponsorship, then renders it", async () => {
    const order: string[] = [];
    mockConnection.mockImplementation(async () => {
      order.push("connection");
    });
    mockLoadAdvertisement.mockImplementation(async () => {
      order.push("load");
      return { sponsorName: "Nike" };
    });

    render(
      await RequestTimeAdSlot({
        placement: "article-sidebar",
        sportSlugs: ["football"],
        fetchOptions: published,
      }),
    );

    expect(screen.getByTestId("ad")).toHaveTextContent("Nike");
    expect(order).toEqual(["connection", "load"]);
    expect(mockLoadAdvertisement).toHaveBeenCalledWith({
      placement: "article-sidebar",
      sportSlugs: ["football"],
      fetchOptions: published,
      now: expect.any(Date),
    });
  });

  it("leaves no placeholder while it loads", () => {
    mockLoadAdvertisement.mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <LiveAdSlot placement="home-sidebar" fetchOptions={published} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe("RankingsWidgetSlot", () => {
  beforeEach(() => {
    mockPolls.mockReset();
  });

  it("holds the card's space while the polls load", () => {
    mockPolls.mockReturnValue(new Promise(() => {}));

    render(<RankingsWidgetSlot sport="football" />);

    expect(screen.getByTestId("rankings-widget-skeleton")).toBeInTheDocument();
  });

  it("shows the sport's polls, and nothing when none are published", async () => {
    mockPolls.mockResolvedValueOnce([{ division: "fcs" }]);
    render(await RequestTimeRankingsWidget({ sport: "football" }));
    expect(screen.getByTestId("widget")).toHaveTextContent("1");
    expect(mockPolls).toHaveBeenCalledWith("football");

    mockPolls.mockResolvedValueOnce([]);
    expect(await RequestTimeRankingsWidget({ sport: "football" })).toBeNull();
  });

  it("renders nothing for a sport that has no polls", () => {
    const { container } = render(
      <RankingsWidgetSlot sport={"baseball" as never} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(mockPolls).not.toHaveBeenCalled();
  });
});
