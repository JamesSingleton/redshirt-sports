import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

const { mockSanityFetchPage, mockNotFound } = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

vi.mock("@/lib/most-read-data", () => ({
  getCachedMostReadPosts: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/rankings-widget-data", () => ({
  getCachedRankingsWidgetPolls: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/components/json-ld", () => ({
  JsonLdScript: () => <script data-testid="json-ld" />,
}));

vi.mock("@/lib/news-archive/cached-nav-chrome", () => ({
  CollegeNewsFiltersSlot: () => <div data-testid="college-filters" />,
  SportNewsFiltersSlot: () => <div data-testid="sport-filters" />,
  FolderConferencePickerSlot: () => <div data-testid="picker" />,
  FolderNewsFiltersBelowHeaderSlot: () => <div data-testid="sport-filters" />,
}));

vi.mock("@/lib/news-archive/cached-sidebar", () => ({
  NewsArchiveSidebarSlot: () => <aside data-testid="sidebar" />,
}));

vi.mock("@/components/news/news-archive-header", () => ({
  NewsArchiveHeader: ({
    title,
    children,
  }: {
    title: string;
    children?: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("@/components/news/news-archive-river", () => ({
  NewsArchiveRiver: () => <div data-testid="river" />,
}));

vi.mock("@/components/pagination-controls", () => ({
  __esModule: true,
  default: () => <nav data-testid="pagination" />,
}));

import { cachedRenderNewsArchivePage } from "@/lib/news-archive/cached-render";

describe("cachedRenderNewsArchivePage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockNotFound.mockClear();
  });

  it("renders the college archive layout", async () => {
    mockSanityFetchPage.mockResolvedValueOnce({
      data: {
        posts: [{ slug: "story", title: "Story" }],
        totalPosts: 1,
      },
    });

    const tree = await cachedRenderNewsArchivePage({
      scope: { type: "college" },
      pageIndex: 1,
      search: "",
      storyType: "",
      sort: "newest",
      filterParams: {},
      perspective: "published",
      stega: false,
    });

    render(tree as ReactElement);
    expect(
      screen.getByRole("heading", { name: "College News" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("river")).toBeInTheDocument();
  });

  it("renders sport archive pages", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          posts: [{ slug: "story", title: "Story" }],
        },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } });

    const tree = await cachedRenderNewsArchivePage({
      scope: { type: "sport", sport: "football" },
      pageIndex: 1,
      search: "",
      storyType: "",
      sort: "newest",
      filterParams: {},
      perspective: "published",
      stega: false,
    });

    render(tree as ReactElement);
    expect(
      screen.getByRole("heading", { name: /Football News/ }),
    ).toBeInTheDocument();
  });

  it("falls back to the sport slug when sport metadata is missing", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          posts: [{ slug: "story", title: "Story" }],
          totalPosts: 1,
        },
      })
      .mockResolvedValueOnce({ data: null });

    const tree = await cachedRenderNewsArchivePage({
      scope: { type: "sport", sport: "football" },
      pageIndex: 1,
      search: "",
      storyType: "",
      sort: "newest",
      filterParams: {},
      perspective: "published",
      stega: false,
    });

    render(tree as ReactElement);
    expect(
      screen.getByRole("heading", { name: /Football News/ }),
    ).toBeInTheDocument();
  });

  it("renders pagination when multiple pages exist", async () => {
    mockSanityFetchPage.mockResolvedValueOnce({
      data: {
        posts: Array.from({ length: 24 }, (_, i) => ({ slug: `story-${i}` })),
      },
    });

    const tree = await cachedRenderNewsArchivePage({
      scope: { type: "college" },
      pageIndex: 1,
      search: "",
      storyType: "",
      sort: "oldest",
      filterParams: {},
      perspective: "published",
      stega: false,
    });

    render(tree as ReactElement);
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("uses the oldest sport news query", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: { posts: [{ slug: "story" }], totalPosts: 1 },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } });

    const tree = await cachedRenderNewsArchivePage({
      scope: { type: "sport", sport: "football" },
      pageIndex: 1,
      search: "",
      storyType: "",
      sort: "oldest",
      filterParams: {},
      perspective: "published",
      stega: false,
    });

    render(tree as ReactElement);
    expect(screen.getByTestId("river")).toBeInTheDocument();
  });

  it("uses the oldest division news query", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: { posts: [{ slug: "story" }], totalPosts: 1 },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: { displayName: "FBS" } });

    const tree = await cachedRenderNewsArchivePage({
      scope: { type: "division", sport: "football", division: "fbs" },
      pageIndex: 1,
      search: "",
      storyType: "",
      sort: "oldest",
      filterParams: {},
      perspective: "published",
      stega: false,
    });

    render(tree as ReactElement);
    expect(screen.getByTestId("river")).toBeInTheDocument();
  });

  it("uses the oldest conference news query", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          posts: [{ slug: "story" }],
          totalPosts: 1,
          conferenceInfo: { name: "SEC", shortName: "SEC" },
        },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: { displayName: "FBS" } });

    const tree = await cachedRenderNewsArchivePage({
      scope: {
        type: "conference",
        sport: "football",
        division: "fbs",
        conference: "sec",
      },
      pageIndex: 1,
      search: "",
      storyType: "",
      sort: "oldest",
      filterParams: {},
      perspective: "published",
      stega: false,
    });

    render(tree as ReactElement);
    expect(screen.getByTestId("river")).toBeInTheDocument();
  });

  it("renders division archive pages with JSON-LD", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          posts: [{ slug: "story", title: "Story" }],
          totalPosts: 1,
        },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: { displayName: "FBS" } });

    const tree = await cachedRenderNewsArchivePage({
      scope: { type: "division", sport: "football", division: "fbs" },
      pageIndex: 1,
      search: "",
      storyType: "",
      sort: "newest",
      filterParams: {},
      perspective: "published",
      stega: false,
    });

    render(tree as ReactElement);
    expect(screen.getByTestId("json-ld")).toBeInTheDocument();
    expect(screen.getByTestId("picker")).toBeInTheDocument();
  });

  it("falls back to route slugs when division display metadata is missing", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          posts: [{ slug: "story" }],
          totalPosts: 1,
        },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: { archiveKicker: "FBS kicker" } });

    const tree = await cachedRenderNewsArchivePage({
      scope: { type: "division", sport: "football", division: "fbs" },
      pageIndex: 1,
      search: "",
      storyType: "",
      sort: "newest",
      filterParams: {},
      perspective: "published",
      stega: false,
    });

    render(tree as ReactElement);
    expect(screen.getByTestId("json-ld")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /fbs Football News/i }),
    ).toBeInTheDocument();
  });

  it("renders conference archive pages", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          posts: [{ slug: "story", title: "Story" }],
          totalPosts: 1,
          conferenceInfo: { name: "SEC", shortName: "SEC" },
        },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: { displayName: "FBS" } });

    const tree = await cachedRenderNewsArchivePage({
      scope: {
        type: "conference",
        sport: "football",
        division: "fbs",
        conference: "sec",
      },
      pageIndex: 1,
      search: "",
      storyType: "",
      sort: "newest",
      filterParams: {},
      perspective: "published",
      stega: false,
    });

    render(tree as ReactElement);
    expect(
      screen.getByRole("heading", { name: /SEC Football News/ }),
    ).toBeInTheDocument();
  });

  it("uses the long conference name when shortName is absent", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          posts: [{ slug: "story" }],
          totalPosts: 1,
          conferenceInfo: { name: "Southeastern Conference" },
        },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: { displayName: "FBS" } });

    const tree = await cachedRenderNewsArchivePage({
      scope: {
        type: "conference",
        sport: "football",
        division: "fbs",
        conference: "sec",
      },
      pageIndex: 1,
      search: "",
      storyType: "",
      sort: "newest",
      filterParams: {},
      perspective: "published",
      stega: false,
    });

    render(tree as ReactElement);
    expect(
      screen.getByRole("heading", {
        name: /Southeastern Conference Football News/,
      }),
    ).toBeInTheDocument();
  });

  it("uses the conference slug when display names are empty", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          posts: [{ slug: "story" }],
          totalPosts: 1,
          conferenceInfo: { name: "", shortName: "" },
        },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: { displayName: "FBS" } });

    const tree = await cachedRenderNewsArchivePage({
      scope: {
        type: "conference",
        sport: "football",
        division: "fbs",
        conference: "sec",
      },
      pageIndex: 1,
      search: "",
      storyType: "",
      sort: "newest",
      filterParams: {},
      perspective: "published",
      stega: false,
    });

    render(tree as ReactElement);
    expect(screen.getByTestId("json-ld")).toBeInTheDocument();
  });

  it("calls notFound when conference metadata is missing", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          posts: [{ slug: "story" }],
          totalPosts: 1,
          conferenceInfo: null,
        },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: { displayName: "FBS" } })
      .mockResolvedValueOnce({ data: [] });

    await expect(
      cachedRenderNewsArchivePage({
        scope: {
          type: "conference",
          sport: "football",
          division: "fbs",
          conference: "sec",
        },
        pageIndex: 1,
        search: "",
        storyType: "",
        sort: "newest",
        filterParams: {},
        perspective: "published",
        stega: false,
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("calls notFound when the feed is empty", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: { posts: [], totalPosts: 0 },
    });

    await expect(
      cachedRenderNewsArchivePage({
        scope: { type: "college" },
        pageIndex: 1,
        search: "",
        storyType: "",
        sort: "newest",
        filterParams: {},
        perspective: "published",
        stega: false,
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
