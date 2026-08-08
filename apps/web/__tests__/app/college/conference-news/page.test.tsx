import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const {
  mockSanityFetchPage,
  mockSanityFetchMetadata,
  mockGetDynamicFetchOptions,
  mockGetPageMetadata,
  mockNotFound,
} = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
  mockSanityFetchMetadata: vi.fn(),
  mockGetDynamicFetchOptions: vi
    .fn()
    .mockResolvedValue({ perspective: "published", stega: false }),
  mockGetPageMetadata: vi.fn(() => ({ title: "Conference News" })),
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/draft-cache", () => ({
  searchParamsPage: (_fallback: unknown, render: () => Promise<unknown>) => render(),
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
  sanityFetchMetadata: mockSanityFetchMetadata,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  conferenceInfoBySlugQuery: "conferenceInfoBySlugQuery",
  queryArticlesBySportDivisionAndConference:
    "queryArticlesBySportDivisionAndConference",
  queryDivisionOrSubgroupingDisplayName: "queryDivisionOrSubgroupingDisplayName",
  sportInfoBySlug: "sportInfoBySlug",
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.xyz",
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("@/components/json-ld", () => ({
  JsonLdScript: () => <script data-testid="json-ld" />,
  organizationId: "org-id",
  websiteId: "website-id",
}));

vi.mock("@/components/page-header", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("@/components/article-feed", () => ({
  __esModule: true,
  default: ({ articles }: { articles: Array<{ title: string }> }) => (
    <div data-testid="article-feed">
      {articles.map((a) => (
        <div key={a.title}>{a.title}</div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/pagination-controls", () => ({
  __esModule: true,
  default: () => <nav data-testid="pagination" />,
}));

import ConferenceNewsPage, {
  generateMetadata,
} from "@/app/college/[sport]/news/[division]/[conference]/page";

describe("ConferenceNewsPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockSanityFetchMetadata.mockReset();
    mockNotFound.mockClear();
  });

  it("generateMetadata throws notFound when conference data is missing", async () => {
    mockSanityFetchMetadata
      .mockResolvedValueOnce({ data: { displayName: "FBS" } })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ data: { title: "Football" } });

    await expect(
      generateMetadata({
        params: Promise.resolve({
          sport: "football",
          division: "fbs",
          conference: "sec",
        }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("generateMetadata uses paginated title for page > 1", async () => {
    mockSanityFetchMetadata
      .mockResolvedValueOnce({ data: { displayName: "FBS" } })
      .mockResolvedValueOnce({ data: { shortName: "SEC", name: "Southeastern Conference" } })
      .mockResolvedValueOnce({ data: { title: "Football" } });

    await generateMetadata({
      params: Promise.resolve({
        sport: "football",
        division: "fbs",
        conference: "sec",
      }),
      searchParams: Promise.resolve({ page: "2" }),
    });

    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("Page 2"),
        slug: "/college/football/news/fbs/sec?page=2",
      }),
      "published",
    );
  });

  it("throws notFound when there are no posts", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: { posts: [], totalPosts: 0, conferenceInfo: null },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: { displayName: "FBS" } });

    await expect(
      ConferenceNewsPage({
        params: Promise.resolve({
          sport: "football",
          division: "fbs",
          conference: "sec",
        }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("throws notFound when conference info is missing on render", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          posts: [{ _id: "1", title: "SEC Story", slug: "sec-story" }],
          totalPosts: 1,
          conferenceInfo: null,
        },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: { displayName: "FBS" } });

    await expect(
      ConferenceNewsPage({
        params: Promise.resolve({
          sport: "football",
          division: "fbs",
          conference: "sec",
        }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders conference news feed", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          posts: [{ _id: "1", title: "SEC Story", slug: "sec-story" }],
          totalPosts: 1,
          conferenceInfo: { name: "Southeastern Conference", shortName: "SEC" },
        },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: { displayName: "FBS" } });

    const page = await ConferenceNewsPage({
      params: Promise.resolve({
        sport: "football",
        division: "fbs",
        conference: "sec",
      }),
      searchParams: Promise.resolve({}),
    });
    render(page as ReactNode);

    expect(screen.getByRole("heading", { name: "SEC Football News" })).toBeInTheDocument();
    expect(screen.getByText("SEC Story")).toBeInTheDocument();
  });

  it("uses conference name when shortName is missing", async () => {
    mockSanityFetchPage
      .mockResolvedValueOnce({
        data: {
          posts: [{ _id: "1", title: "Conference Story", slug: "conf-story" }],
          totalPosts: 24,
          conferenceInfo: {
            name: "Southeastern Conference",
            shortName: null,
          },
        },
      })
      .mockResolvedValueOnce({ data: { title: "Football" } })
      .mockResolvedValueOnce({ data: { displayName: "FBS" } });

    const page = await ConferenceNewsPage({
      params: Promise.resolve({
        sport: "football",
        division: "fbs",
        conference: "sec",
      }),
      searchParams: Promise.resolve({ page: "2" }),
    });
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", {
        name: "Southeastern Conference Football News",
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });
});
