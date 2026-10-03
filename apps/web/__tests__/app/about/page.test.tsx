import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const { mockSanityFetchPage, mockGetDynamicFetchOptions, mockGetPageMetadata } =
  vi.hoisted(() => ({
    mockSanityFetchPage: vi.fn(),
    mockGetDynamicFetchOptions: vi
      .fn()
      .mockResolvedValue({ perspective: "published", stega: false }),
    mockGetPageMetadata: vi.fn(() => ({ title: "About Us" })),
  }));

vi.mock("@/lib/draft-cache", () => ({
  draftAwarePage: (
    _fallback: unknown,
    render: (options: {
      perspective: string;
      stega: boolean;
    }) => Promise<unknown>,
  ) => render({ perspective: "published", stega: false }),
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  PUBLISHED_FETCH_OPTIONS: {
    perspective: "published",
    stega: false,
  },
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
}));

vi.mock("@redshirt-sports/sanity/queries", () => ({
  authorsListNotArchived: "authorsListNotArchived",
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/json-ld", () => ({
  JsonLdScript: () => <script data-testid="json-ld" />,
  websiteId: "website-id",
}));

vi.mock("@/components/page-header", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" data-testid="author-image" />,
}));

import AboutPage, { generateMetadata } from "@/app/about/page";

describe("AboutPage", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
    mockSanityFetchPage.mockResolvedValue({ data: [] });
  });

  it("generateMetadata calls getPageMetadata with about fields", async () => {
    await generateMetadata();
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ title: "About Us", slug: "/about" }),
      "published",
    );
  });

  it("renders about content and author list", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: [
        {
          _id: "author-1",
          name: "Jane Author",
          slug: "jane-author",
          roles: ["Writer"],
          image: null,
          socialLinks: { twitter: "https://twitter.com/jane" },
        },
      ],
    });

    const page = await AboutPage();
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: /About Redshirt Sports/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/passion for college football/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Jane Author" })).toHaveAttribute(
      "href",
      "/authors/jane-author",
    );
    expect(
      screen.getByRole("heading", { name: "Our team" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Writer")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Write for us" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Contact our editors" }),
    ).toHaveAttribute("href", "/contact");
  });

  it("renders authors without roles", async () => {
    mockSanityFetchPage.mockResolvedValue({
      data: [
        {
          _id: "author-1",
          name: "Jane Author",
          slug: "jane-author",
          roles: null,
          image: null,
          socialLinks: null,
        },
        {
          _id: "author-2",
          name: "John Writer",
          slug: "john-writer",
          roles: [],
          image: null,
          socialLinks: null,
        },
      ],
    });

    const page = await AboutPage();
    const { container } = render(page as ReactNode);

    expect(screen.getByRole("link", { name: "Jane Author" })).toHaveAttribute(
      "href",
      "/authors/jane-author",
    );
    expect(screen.getByRole("link", { name: "John Writer" })).toHaveAttribute(
      "href",
      "/authors/john-writer",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(
      container.querySelectorAll("li p.text-muted-foreground"),
    ).toHaveLength(0);
  });

  it("hides the team section when there are no authors", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: [] });

    const page = await AboutPage();
    render(page as ReactNode);

    expect(
      screen.queryByRole("heading", { name: "Our team" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Contact our editors" }),
    ).toHaveAttribute("href", "/contact");
  });
});
