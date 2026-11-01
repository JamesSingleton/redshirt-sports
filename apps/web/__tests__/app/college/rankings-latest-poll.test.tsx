import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockGetCachedLatestPublishedPoll,
  mockLoadRankingsWeekPageModel,
  mockLoadAdvertisement,
  mockGetPageMetadata,
  mockDraftAwareParamsPage,
  mockRankingsWeekChrome,
} = vi.hoisted(() => ({
  mockRankingsWeekChrome: vi.fn(),
  mockGetCachedLatestPublishedPoll: vi.fn(),
  mockLoadRankingsWeekPageModel: vi.fn(),
  mockLoadAdvertisement: vi.fn(),
  mockGetPageMetadata: vi.fn((input: unknown) => input),
  mockDraftAwareParamsPage: vi.fn(
    async (
      params: Promise<unknown>,
      _fallback: unknown,
      render: (resolved: unknown, options?: unknown) => Promise<ReactNode>,
    ) => render(await params),
  ),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  getDynamicFetchOptions: vi
    .fn()
    .mockResolvedValue({ perspective: "published", stega: false }),
  PUBLISHED_FETCH_OPTIONS: { perspective: "published", stega: false },
}));

vi.mock("@/lib/draft-cache", () => ({
  draftAwareParamsPage: mockDraftAwareParamsPage,
}));

vi.mock("@/lib/rankings-data", () => ({
  getCachedLatestPublishedPoll: mockGetCachedLatestPublishedPoll,
}));

vi.mock("@/lib/rankings/read-model", () => ({
  loadRankingsWeekPageModel: mockLoadRankingsWeekPageModel,
  pollDivisionLabel: (division: string) => division.toUpperCase(),
}));

vi.mock("@/lib/advertisement", () => ({
  loadAdvertisement: mockLoadAdvertisement,
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("@/components/rankings/rankings-week-chrome", () => ({
  RankingsWeekChrome: (props: unknown) => {
    mockRankingsWeekChrome(props);
    return <div data-testid="week-chrome" />;
  },
}));

vi.mock("@/components/rankings/rankings-week-page-body", () => ({
  RankingsWeekPageBody: ({
    model,
    context,
  }: {
    model: { titleWeek: string };
    context: ReactNode;
  }) => (
    <div data-testid="week-body" data-week={model.titleWeek}>
      {context}
    </div>
  ),
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

import LatestPollPage, {
  generateMetadata,
} from "@/app/college/[sport]/rankings/[division]/page";

const params = (division = "fcs") =>
  Promise.resolve({ sport: "football", division });

describe("LatestPollPage", () => {
  beforeEach(() => {
    mockGetCachedLatestPublishedPoll.mockReset().mockResolvedValue({
      division: "fcs",
      week: 8,
      year: 2026,
      publishedAt: new Date("2026-10-26T15:00:00Z"),
    });
    mockLoadRankingsWeekPageModel
      .mockReset()
      .mockResolvedValue({ titleWeek: "Week 8" });
    mockLoadAdvertisement.mockReset().mockResolvedValue(null);
    mockGetPageMetadata.mockClear();
    mockRankingsWeekChrome.mockReset();
  });

  it("renders the latest published week with a link into the archive", async () => {
    render(await LatestPollPage({ params: params() }));

    expect(mockGetCachedLatestPublishedPoll).toHaveBeenCalledWith({
      sport: "football",
      division: "fcs",
    });
    expect(mockLoadRankingsWeekPageModel).toHaveBeenCalledWith({
      sport: "football",
      division: "fcs",
      year: "2026",
      week: "8",
    });
    expect(screen.getByTestId("rankings-latest-context")).toHaveTextContent(
      "Latest poll: 2026 Week 8 · Published Oct 26, 2026 · See all weeks",
    );
    expect(screen.getByRole("link", { name: "2026 Week 8" })).toHaveAttribute(
      "href",
      "/college/football/rankings/fcs/2026/8",
    );
    expect(mockRankingsWeekChrome).toHaveBeenCalledWith(
      expect.objectContaining({ pinSelection: true }),
    );
    await expect(
      mockRankingsWeekChrome.mock.calls[0]![0].params,
    ).resolves.toEqual({
      sport: "football",
      division: "fcs",
      year: "2026",
      week: "8",
    });
    expect(screen.getByRole("link", { name: "See all weeks" })).toHaveAttribute(
      "href",
      "/college/football/rankings/fcs/history",
    );
  });

  it("omits the publish date when it is unknown", async () => {
    mockGetCachedLatestPublishedPoll.mockResolvedValue({
      division: "fcs",
      week: 0,
      year: 2027,
      publishedAt: null,
    });
    mockLoadRankingsWeekPageModel.mockResolvedValue({ titleWeek: "Preseason" });

    render(await LatestPollPage({ params: params() }));

    expect(mockLoadRankingsWeekPageModel).toHaveBeenCalledWith(
      expect.objectContaining({ year: "2027", week: "0" }),
    );
    expect(screen.getByTestId("rankings-latest-context")).toHaveTextContent(
      "Latest poll: 2027 Preseason · See all weeks",
    );
  });

  it("404s until the poll has a published week", async () => {
    mockGetCachedLatestPublishedPoll.mockResolvedValue(null);

    await expect(
      LatestPollPage({ params: params("power-conferences") }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(
      generateMetadata({ params: params("power-conferences") }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockLoadRankingsWeekPageModel).not.toHaveBeenCalled();
  });

  it("uses the stable URL as the canonical slug", async () => {
    await generateMetadata({ params: params() });

    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "FCS College Football Top 25 Rankings",
        slug: "/college/football/rankings/fcs",
        description: expect.stringContaining("2026 Week 8 poll"),
      }),
      "published",
    );
  });
});
