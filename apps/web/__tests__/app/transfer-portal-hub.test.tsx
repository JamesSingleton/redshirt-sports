import { render, screen, within } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { wireData, wireRow } from "../helpers/portal-wire";

const { mockPublic, mockHub, mockFetch, mockGetPageMetadata } = vi.hoisted(
  () => ({
    mockPublic: vi.fn(),
    mockHub: vi.fn(),
    mockFetch: vi.fn(),
    mockGetPageMetadata: vi.fn((input: unknown) => input),
  }),
);

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com/",
}));
vi.mock("@/lib/portal-data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/portal-data")>()),
  portalIsPublic: mockPublic,
}));
vi.mock("@/lib/portal-hub", () => ({ getPortalHubData: mockHub }));
vi.mock("@/lib/sanity-fetch", () => ({ sanityFetchPage: mockFetch }));
vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));
vi.mock("@redshirt-sports/sanity/live", () => ({
  getDynamicFetchOptions: async () => ({ perspective: "published" }),
}));
vi.mock("@redshirt-sports/sanity/queries", () => ({
  queryPortalNews: "PORTAL_NEWS",
}));
vi.mock("@/lib/draft-cache", () => ({
  draftAwareSearchParamsPage: (
    searchParams: Promise<unknown>,
    _fallback: ReactNode,
    render: (resolved: unknown, options: unknown) => Promise<ReactNode>,
  ) =>
    searchParams.then((resolved) =>
      render(resolved, { perspective: "published", stega: false }),
    ),
}));
vi.mock("@/components/json-ld", () => ({
  JsonLdScript: ({ data, id }: { data: unknown; id: string }) => (
    <script type="application/ld+json" id={id}>
      {JSON.stringify(data)}
    </script>
  ),
}));
vi.mock("@/components/news/news-archive-river", () => ({
  NewsArchiveRiver: (props: {
    posts: { title: string }[];
    pageIndex: number;
    totalPages: number;
  }) => (
    <div
      data-testid="river"
      data-page={props.pageIndex}
      data-pages={props.totalPages}
    >
      {props.posts.map((post) => post.title).join("|")}
    </div>
  ),
}));
vi.mock("@/components/pagination-controls", () => ({
  default: ({ totalPosts }: { totalPosts: number }) => (
    <div data-testid="pagination" data-total={totalPosts} />
  ),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    prefetch: _prefetch,
    ...rest
  }: {
    children: ReactNode;
    href: string;
    prefetch?: boolean;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import TransferPortalHubPage, {
  generateMetadata,
} from "@/app/transfer-portal/page";
import { PortalHubSkeleton } from "@/components/portal/hub-page";

const page = (value?: string) => ({
  searchParams: Promise.resolve(value ? { page: value } : {}),
});
const content = (value?: string) =>
  TransferPortalHubPage(page(value)) as unknown as Promise<ReactElement>;

const wire = wireData([]);
const hub = {
  sports: [
    {
      sport: "football",
      cycleYear: 2027,
      counts: { all: 1234, entered: 1200, committed: 30, withdrawn: 4 },
    },
  ],
  moves: [
    {
      sport: "football",
      wire,
      row: wireRow({
        eventId: 1,
        position: "QB",
        status: "committed",
        destination: { schoolId: "boise" },
      }),
    },
    {
      sport: "mens-basketball",
      wire,
      row: wireRow({ eventId: 2, firstName: "Ann", lastName: "Lee" }),
    },
    {
      sport: "football",
      wire,
      row: wireRow({
        eventId: 3,
        firstName: "Bo",
        lastName: "Cole",
        status: "withdrawn",
        origin: {},
      }),
    },
    {
      sport: "football",
      wire,
      row: wireRow({
        eventId: 4,
        firstName: "Cy",
        lastName: "Ray",
        origin: {},
      }),
    },
  ],
};
const stories = (count: number, total = count) => ({
  data: {
    posts: Array.from({ length: count }, (_, i) => ({
      _id: `p${i}`,
      title: `Story ${i}`,
      slug: `story-${i}`,
    })),
    totalPosts: total,
  },
});

describe("transfer portal hub", () => {
  beforeEach(() => {
    mockPublic.mockReturnValue(true);
    mockHub.mockResolvedValue(hub);
    mockFetch.mockResolvedValue(stories(2));
  });
  afterEach(() => vi.clearAllMocks());

  it("is a real 404 while the portal is hidden", async () => {
    mockPublic.mockReturnValue(false);
    expect(() => TransferPortalHubPage(page())).toThrow("NEXT_NOT_FOUND");
    expect(await generateMetadata(page())).toEqual({});
  });

  it("titles and canonicalizes each page of stories", async () => {
    expect(await generateMetadata(page())).toMatchObject({
      title: "College Transfer Portal: News and Latest Moves",
      slug: "/transfer-portal",
    });
    expect(await generateMetadata(page("3"))).toMatchObject({
      title: "College Transfer Portal: News and Latest Moves - Page 3",
      slug: "/transfer-portal?page=3",
    });
    expect(await generateMetadata(page("junk"))).toMatchObject({
      slug: "/transfer-portal",
    });
  });

  it("shows each sport's tracker with this cycle's counts", async () => {
    render(await content());
    expect(
      screen.getByRole("heading", { level: 1, name: "Transfer Portal" }),
    ).toBeInTheDocument();
    const trackers = screen.getByRole("list", { name: "Trackers by sport" });
    const card = within(trackers).getByRole("link");
    expect(card).toHaveAttribute("href", "/college/football/transfer-portal");
    expect(card).toHaveTextContent("2027 portal");
    expect(card).toHaveTextContent("1,200");
    expect(card).toHaveTextContent("Football tracker");
  });

  it("lists the latest moves, linking to each player", async () => {
    render(await content());
    const moves = screen.getByRole("region", { name: "Latest moves" });
    expect(
      within(moves).getByRole("link", { name: "Jalen Brooks" }),
    ).toHaveAttribute("href", "/players/jalen-brooks-100001");
    expect(within(moves).getByText(/QB · Football/)).toBeInTheDocument();
    // No position: just the sport.
    expect(within(moves).getByText(/^Men's Basketball/)).toBeInTheDocument();
    // Read out for screen readers, where the logos say it visually.
    expect(
      within(moves).getByText(", Montana to Boise State University"),
    ).toBeInTheDocument();
    expect(
      within(moves).getByText(", Montana to undecided"),
    ).toBeInTheDocument();
    expect(
      within(moves).getByText(", returning to previous school"),
    ).toBeInTheDocument();
    expect(
      within(moves).getByText(", undisclosed to undecided"),
    ).toBeInTheDocument();
  });

  it("shows portal stories and describes them in JSON-LD", async () => {
    const { container } = render(await content());
    expect(mockFetch).toHaveBeenCalledWith({
      query: "PORTAL_NEWS",
      params: { from: 0, to: 12 },
      perspective: "published",
      stega: false,
    });
    expect(screen.getByTestId("river")).toHaveTextContent("Story 0|Story 1");
    expect(screen.queryByTestId("pagination")).toBeNull();
    const ld = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')!
        .textContent!,
    );
    expect(ld).toMatchObject({
      "@type": "CollectionPage",
      url: "https://redshirtsports.com/transfer-portal",
      mainEntity: { numberOfItems: 2 },
    });
    expect(
      ld.breadcrumb.itemListElement.map((item: { name: string }) => item.name),
    ).toEqual(["Home", "Transfer Portal"]);
  });

  it("pages through stories and 404s past the end", async () => {
    mockFetch.mockResolvedValueOnce(stories(12, 30));
    const { container } = render(await content("2"));
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({ params: { from: 12, to: 24 } }),
    );
    expect(screen.getByTestId("river")).toHaveAttribute("data-pages", "3");
    expect(screen.getByTestId("pagination")).toHaveAttribute(
      "data-total",
      "30",
    );
    expect(
      JSON.parse(
        container.querySelector('script[type="application/ld+json"]')!
          .textContent!,
      ).url,
    ).toBe("https://redshirtsports.com/transfer-portal?page=2");

    mockFetch.mockResolvedValueOnce(stories(0));
    await expect(content("9")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("says so when there's nothing yet", async () => {
    mockHub.mockResolvedValueOnce({ sports: [], moves: [] });
    mockFetch.mockResolvedValueOnce({ data: null });
    render(await content());
    expect(screen.getByText("No portal stories yet.")).toBeInTheDocument();
    expect(
      screen.getByText("No moves reported yet this cycle."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Trackers by sport" }),
    ).toBeNull();

    // Posts without a total: the count falls back to what came back.
    mockFetch.mockResolvedValueOnce({ data: { posts: stories(1).data.posts } });
    render(await content());
    expect(screen.getByTestId("river")).toHaveAttribute("data-pages", "1");
  });

  it("renders the skeleton", () => {
    const { container } = render(<PortalHubSkeleton />);
    expect(container.querySelector("[aria-busy]")).not.toBeNull();
  });
});
