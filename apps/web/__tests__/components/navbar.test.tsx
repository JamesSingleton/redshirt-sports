import { render, screen } from "@testing-library/react";

import {
  CachedNavbarServer,
  DynamicNavbarServer,
  Navbar,
  NavbarSkeleton,
} from "@/components/navbar";

const {
  mockGetDynamicFetchOptions,
  mockSanityFetch,
  mockGetCachedNavbarLatestRankings,
} = vi.hoisted(() => ({
  mockGetDynamicFetchOptions: vi.fn(),
  mockSanityFetch: vi.fn(),
  mockGetCachedNavbarLatestRankings: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
  sanityFetch: mockSanityFetch,
}));

vi.mock("@/lib/rankings-data", () => ({
  getCachedNavbarLatestRankings: mockGetCachedNavbarLatestRankings,
}));

vi.mock("@/components/navbar-client", () => ({
  NavbarClient: () => <nav data-testid="navbar-client">Client navbar</nav>,
  NavbarSkeletonResponsive: () => (
    <div data-testid="navbar-skeleton-responsive">Skeleton</div>
  ),
}));

vi.mock("@/components/logo", () => ({
  Logo: ({ alt }: { alt?: string | null }) => <div>{alt}</div>,
}));

const navbarData = [{ _id: "sport-1", name: "Football", slug: "football" }];
const settingsData = {
  siteTitle: "Redshirt Sports",
  logo: { alt: "Logo" },
};
const latestRankings = [{ sport: "football", divisions: [] }];

describe("Navbar", () => {
  it("renders the logo and client navbar", () => {
    render(
      <Navbar
        navbarData={navbarData as never}
        settingsData={settingsData as never}
        latestRankings={latestRankings}
      />,
    );

    expect(screen.getByText("Redshirt Sports")).toBeInTheDocument();
    expect(screen.getByTestId("navbar-client")).toBeInTheDocument();
  });

  it("renders without a logo and falls back to empty rankings", () => {
    render(
      <Navbar
        navbarData={navbarData as never}
        settingsData={null as never}
        latestRankings={undefined}
      />,
    );

    expect(screen.getByTestId("navbar-client")).toBeInTheDocument();
    expect(screen.queryByText("Redshirt Sports")).not.toBeInTheDocument();
  });
});

describe("NavbarSkeleton", () => {
  it("renders the navbar loading skeleton", () => {
    render(<NavbarSkeleton />);
    expect(
      screen.getByTestId("navbar-skeleton-responsive"),
    ).toBeInTheDocument();
  });
});

describe("CachedNavbarServer", () => {
  beforeEach(() => {
    mockGetCachedNavbarLatestRankings.mockResolvedValue(latestRankings);
    mockSanityFetch
      .mockResolvedValueOnce({ data: navbarData })
      .mockResolvedValueOnce({ data: settingsData });
  });

  it("fetches navbar data and renders the memoized navbar", async () => {
    const component = await CachedNavbarServer({
      perspective: "published",
      stega: false,
    });
    render(component);

    expect(mockGetCachedNavbarLatestRankings).toHaveBeenCalled();
    expect(screen.getByTestId("navbar-client")).toBeInTheDocument();
  });
});

describe("DynamicNavbarServer", () => {
  it("loads dynamic fetch options before rendering", async () => {
    mockGetDynamicFetchOptions.mockResolvedValue({
      perspective: "published",
      stega: false,
    });

    const component = await DynamicNavbarServer();

    expect(mockGetDynamicFetchOptions).toHaveBeenCalled();
    expect(component).toBeTruthy();
  });
});
