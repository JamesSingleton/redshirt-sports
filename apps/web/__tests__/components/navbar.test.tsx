import { render } from "@testing-library/react";

import { CachedNavbarServer } from "@/components/navbar";

const { mockSanityFetch, mockFetchGlobalSeoSettings, mockNavbarClient } =
  vi.hoisted(() => ({
    mockSanityFetch: vi.fn(),
    mockFetchGlobalSeoSettings: vi.fn(),
    mockNavbarClient: vi.fn(),
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
