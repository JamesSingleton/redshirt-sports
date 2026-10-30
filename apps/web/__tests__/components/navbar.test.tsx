import { render, screen } from "@testing-library/react";

import {
  CachedNavbarServer,
  DynamicNavbarServer,
  Navbar,
  NavbarSkeleton,
} from "@/components/navbar";

const {
  mockResolveDynamicFetchOptions,
  mockSanityFetch,
  mockGetCachedNavbarLatestRankings,
} = vi.hoisted(() => ({
  mockResolveDynamicFetchOptions: vi.fn(),
  mockSanityFetch: vi.fn(),
  mockGetCachedNavbarLatestRankings: vi.fn(),
}));

vi.mock("@/lib/resolve-dynamic-fetch-options", () => ({
  resolveDynamicFetchOptions: mockResolveDynamicFetchOptions,
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  PUBLISHED_FETCH_OPTIONS: {
    perspective: "published",
    stega: false,
  },
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
  it("renders the client navbar", () => {
    render(
      <Navbar
        navbarData={navbarData as never}
        settingsData={settingsData as never}
        latestRankings={latestRankings}
      />,
    );

    expect(screen.getByTestId("navbar-client")).toBeInTheDocument();
  });

  it("renders with empty rankings", () => {
    render(
      <Navbar
        navbarData={navbarData as never}
        settingsData={null as never}
        latestRankings={undefined}
      />,
    );

    expect(screen.getByTestId("navbar-client")).toBeInTheDocument();
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
    mockSanityFetch.mockResolvedValue({ data: settingsData });
  });

  it("fetches navbar data and renders the memoized navbar", async () => {
    const component = await CachedNavbarServer({
      perspective: "published",
      stega: false,
    });
    render(component);

    expect(mockSanityFetch).toHaveBeenCalledTimes(2);
    expect(mockGetCachedNavbarLatestRankings).toHaveBeenCalled();
    expect(screen.getByTestId("navbar-client")).toBeInTheDocument();
  });
});

describe("DynamicNavbarServer", () => {
  it("resolves fetch options before rendering", async () => {
    mockResolveDynamicFetchOptions.mockResolvedValue({
      perspective: "published",
      stega: false,
    });

    const component = await DynamicNavbarServer();

    expect(mockResolveDynamicFetchOptions).toHaveBeenCalled();
    expect(component).toBeTruthy();
  });
});
