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
  mockFetchGlobalSeoSettings,
  mockNavbarClient,
} = vi.hoisted(() => ({
  mockResolveDynamicFetchOptions: vi.fn(),
  mockSanityFetch: vi.fn(),
  mockFetchGlobalSeoSettings: vi.fn(),
  mockNavbarClient: vi.fn(),
}));

vi.mock("@/lib/resolve-dynamic-fetch-options", () => ({
  resolveDynamicFetchOptions: mockResolveDynamicFetchOptions,
}));

vi.mock("@/lib/global-seo-settings", () => ({
  fetchGlobalSeoSettings: mockFetchGlobalSeoSettings,
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  PUBLISHED_FETCH_OPTIONS: {
    perspective: "published",
    stega: false,
  },
  cachedSanity: mockSanityFetch,
}));

vi.mock("@/components/navbar-client", () => ({
  NavbarClient: (props: { items: unknown[] }) => {
    mockNavbarClient(props);
    return <nav data-testid="navbar-client">Client navbar</nav>;
  },
  NavbarSkeletonResponsive: () => (
    <div data-testid="navbar-skeleton-responsive">Skeleton</div>
  ),
}));

vi.mock("@/components/logo", () => ({
  Logo: ({ alt }: { alt?: string | null }) => <div>{alt}</div>,
}));

const items = [{ _key: "teams", _type: "navbarLink", name: "Teams" }];
const settingsData = {
  siteTitle: "Redshirt Sports",
  logo: { alt: "Logo" },
};

describe("Navbar", () => {
  it("renders the client navbar", () => {
    render(
      <Navbar items={items as never} settingsData={settingsData as never} />,
    );

    expect(screen.getByTestId("navbar-client")).toBeInTheDocument();
  });

  it("renders with empty settings", () => {
    render(<Navbar items={[]} settingsData={null as never} />);

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
    mockSanityFetch.mockReset().mockResolvedValue({ data: { items } });
    mockFetchGlobalSeoSettings.mockResolvedValue(settingsData);
    mockNavbarClient.mockReset();
  });

  it("renders the navbar document's items, with no Postgres reads", async () => {
    const component = await CachedNavbarServer({
      perspective: "published",
      stega: false,
    });
    render(component);

    expect(mockSanityFetch).toHaveBeenCalledTimes(1);
    expect(mockFetchGlobalSeoSettings).toHaveBeenCalledTimes(1);
    expect(mockNavbarClient).toHaveBeenCalledWith(
      expect.objectContaining({ items }),
    );
  });

  it("renders an empty nav when the navbar document is missing", async () => {
    mockSanityFetch.mockResolvedValue({ data: null });
    render(
      await CachedNavbarServer({ perspective: "published", stega: false }),
    );

    expect(mockNavbarClient).toHaveBeenCalledWith(
      expect.objectContaining({ items: [] }),
    );
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
