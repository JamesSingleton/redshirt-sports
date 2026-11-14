const { mockPublic, mockPlayers } = vi.hoisted(() => ({
  mockPublic: vi.fn(),
  mockPlayers: vi.fn(),
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com/",
}));
vi.mock("@/lib/portal-data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/portal-data")>()),
  portalIsPublic: mockPublic,
  getCachedIndexablePlayers: mockPlayers,
}));

import sitemap from "@/app/players/sitemap";

describe("player sitemap", () => {
  afterEach(() => vi.clearAllMocks());

  it("is empty while the portal is hidden", async () => {
    mockPublic.mockReturnValue(false);
    expect(await sitemap()).toEqual([]);
    expect(mockPlayers).not.toHaveBeenCalled();
  });

  it("lists every indexable player's page", async () => {
    mockPublic.mockReturnValue(true);
    mockPlayers.mockResolvedValue([
      {
        id: 100000,
        slug: "jalen-brooks",
        publishedAt: "2026-01-06T00:00:00.000Z",
      },
    ]);
    expect(await sitemap()).toEqual([
      {
        url: "https://redshirtsports.com/players/jalen-brooks-100000",
        lastModified: "2026-01-06T00:00:00.000Z",
        changeFrequency: "weekly",
        priority: 0.6,
      },
    ]);
  });
});
