import { render, screen } from "@testing-library/react";

import {
  CachedNavbarServer,
  DynamicNavbarServer,
  NavbarSkeleton,
} from "@/components/navbar";

const { mockGetDynamicFetchOptions, mockSanityFetch } = vi.hoisted(() => ({
  mockGetDynamicFetchOptions: vi.fn(),
  mockSanityFetch: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
  sanityFetch: mockSanityFetch,
}));

vi.mock("@/components/site-header/primary-nav", () => ({
  PrimaryNav: ({ items }: { items: { key: string }[] }) => (
    <nav data-testid="primary-nav">{items.length} items</nav>
  ),
}));

vi.mock("@/components/site-header/mobile-nav", () => ({
  MobileNav: ({ brandName }: { brandName: string }) => (
    <button type="button" data-brand={brandName}>
      Open menu
    </button>
  ),
}));

vi.mock("@/components/sanity-image", () => ({
  default: ({ image }: { image: { id: string } }) => (
    <img alt={`logo ${image.id}`} />
  ),
}));

const navbarData = {
  _id: "navbar",
  logo: null,
  logoDark: null,
  items: [
    {
      _key: "teams",
      type: "link",
      name: "Teams",
      href: "/college/teams",
      openInNewTab: false,
    },
  ],
  secondaryLinks: [
    {
      _key: "fcs",
      name: "FCS",
      href: "/college/football/news/fcs",
      openInNewTab: false,
    },
  ],
  cta: { name: "Vote", href: "/vote", openInNewTab: true },
};

describe("CachedNavbarServer", () => {
  it("renders the primary nav, mobile menu, search and CTA", async () => {
    mockSanityFetch.mockResolvedValue({ data: navbarData });

    render(
      await CachedNavbarServer({ perspective: "published", stega: false }),
    );

    expect(screen.getByTestId("primary-nav")).toHaveTextContent("1 items");
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "data-brand",
      "Redshirt Sports",
    );
    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: "Search articles" }),
    ).toHaveAttribute("name", "q");
    expect(screen.getByRole("link", { name: "Search" })).toHaveAttribute(
      "href",
      "/search",
    );

    const cta = screen.getByRole("link", { name: "Vote" });
    expect(cta).toHaveAttribute("href", "/vote");
    expect(cta).toHaveAttribute("target", "_blank");
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");

    expect(
      screen.queryByRole("link", { name: "Log in" }),
    ).not.toBeInTheDocument();
  });

  it("falls back to the brand text and omits the CTA", async () => {
    mockSanityFetch.mockResolvedValue({
      data: { ...navbarData, cta: null, secondaryLinks: null },
    });

    render(
      await CachedNavbarServer({ perspective: "published", stega: false }),
    );

    expect(
      screen.getByRole("link", { name: "Redshirt Sports home" }),
    ).toHaveTextContent("Redshirt Sports");
    expect(
      screen.queryByRole("link", { name: "Vote" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders the light and dark Sanity logos when configured", async () => {
    mockSanityFetch.mockResolvedValue({
      data: { ...navbarData, logo: { id: "light" }, logoDark: { id: "dark" } },
    });

    render(
      await CachedNavbarServer({ perspective: "published", stega: false }),
    );

    expect(screen.getByAltText("logo light")).toBeInTheDocument();
    expect(screen.getByAltText("logo dark")).toBeInTheDocument();
  });

  it("reuses the light logo in dark mode when no dark logo is set", async () => {
    mockSanityFetch.mockResolvedValue({
      data: { ...navbarData, logo: { id: "light" } },
    });

    render(
      await CachedNavbarServer({ perspective: "published", stega: false }),
    );

    expect(screen.getAllByAltText("logo light")).toHaveLength(2);
  });

  it("renders the brand fallback when the navbar document is missing", async () => {
    mockSanityFetch.mockResolvedValue({ data: null });

    render(
      await CachedNavbarServer({ perspective: "published", stega: false }),
    );

    expect(
      screen.getByRole("link", { name: "Redshirt Sports home" }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByTestId("primary-nav")).toHaveTextContent("0 items");
  });
});

describe("NavbarSkeleton", () => {
  it("renders a logo placeholder", () => {
    const { container } = render(<NavbarSkeleton />);
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull();
  });
});

describe("DynamicNavbarServer", () => {
  it("loads dynamic fetch options before rendering", async () => {
    mockGetDynamicFetchOptions.mockResolvedValue({
      perspective: "drafts",
      stega: true,
    });

    const component = await DynamicNavbarServer();

    expect(mockGetDynamicFetchOptions).toHaveBeenCalled();
    expect(component.props).toEqual({ perspective: "drafts", stega: true });
  });
});
