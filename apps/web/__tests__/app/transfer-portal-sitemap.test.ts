const { mockPublic, mockCycles } = vi.hoisted(() => ({
  mockPublic: vi.fn(),
  mockCycles: vi.fn(),
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com/",
}));
vi.mock("@/lib/portal-data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/portal-data")>()),
  portalIsPublic: mockPublic,
  getCachedPortalCycles: mockCycles,
}));

import sitemap from "@/app/transfer-portal/sitemap";

describe("transfer portal sitemap", () => {
  afterEach(() => vi.clearAllMocks());

  it("is empty while the portal is hidden", async () => {
    mockPublic.mockReturnValue(false);
    expect(await sitemap()).toEqual([]);
    expect(mockCycles).not.toHaveBeenCalled();
  });

  it("lists each sport's tracker and its past cycles", async () => {
    mockPublic.mockReturnValue(true);
    mockCycles.mockImplementation(async (sport: string) =>
      sport === "football"
        ? { cycles: [2027, 2026, 2025], current: 2027 }
        : { cycles: [], current: 2027 },
    );
    const entries = await sitemap();
    expect(entries).toEqual([
      {
        url: "https://redshirtsports.com/college/football/transfer-portal",
        changeFrequency: "daily",
        priority: 0.8,
      },
      {
        url: "https://redshirtsports.com/college/football/transfer-portal/2026",
        changeFrequency: "yearly",
        priority: 0.5,
      },
      {
        url: "https://redshirtsports.com/college/football/transfer-portal/2025",
        changeFrequency: "yearly",
        priority: 0.5,
      },
      {
        url: "https://redshirtsports.com/college/mens-basketball/transfer-portal",
        changeFrequency: "daily",
        priority: 0.8,
      },
      {
        url: "https://redshirtsports.com/college/womens-basketball/transfer-portal",
        changeFrequency: "daily",
        priority: 0.8,
      },
    ]);
  });
});
