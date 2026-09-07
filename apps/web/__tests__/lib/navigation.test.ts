const { mockSanityFetch, mockGetCachedNavbarLatestRankings } = vi.hoisted(
  () => ({
    mockSanityFetch: vi.fn(),
    mockGetCachedNavbarLatestRankings: vi.fn(),
  }),
);

vi.mock("@redshirt-sports/sanity/live", () => ({
  sanityFetch: mockSanityFetch,
}));

vi.mock("@/lib/rankings-data", () => ({
  getCachedNavbarLatestRankings: mockGetCachedNavbarLatestRankings,
}));

import { getGlobalSettings, getNavigationData } from "@/lib/navigation";

describe("navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getGlobalSettings returns Sanity settings data", async () => {
    mockSanityFetch.mockResolvedValue({ data: { siteTitle: "Redshirt" } });

    await expect(
      getGlobalSettings({ perspective: "published", stega: false }),
    ).resolves.toEqual({ siteTitle: "Redshirt" });
  });

  it("getNavigationData aggregates rankings, nav, and settings", async () => {
    const latestRankings = [{ sport: "football", divisions: [] }];
    const navbarData = [{ _id: "sport-1" }];
    const settingsData = { siteTitle: "Redshirt" };

    mockGetCachedNavbarLatestRankings.mockResolvedValue(latestRankings);
    mockSanityFetch
      .mockResolvedValueOnce({ data: navbarData })
      .mockResolvedValueOnce({ data: settingsData });

    await expect(
      getNavigationData({ perspective: "published", stega: false }),
    ).resolves.toEqual({
      navbarData,
      settingsData,
      latestRankings,
    });
  });
});
