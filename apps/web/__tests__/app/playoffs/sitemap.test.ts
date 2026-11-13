import { bracketEdition } from "@/__tests__/helpers/bracket-fixtures";

const { mockList } = vi.hoisted(() => ({ mockList: vi.fn() }));

vi.mock("@redshirt-sports/db/queries", () => ({
  listAllPublishedBracketEditions: mockList,
}));
vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com/",
}));

import sitemap from "@/app/playoffs/sitemap";

const BASE = "https://redshirtsports.com/college/football/playoffs/fcs";

describe("playoffs sitemap", () => {
  beforeEach(() => mockList.mockReset());

  it("is empty until a bracket publishes", async () => {
    mockList.mockResolvedValue([]);
    await expect(sitemap()).resolves.toEqual([]);
  });

  it("lists each division, season and projection with its newest change", async () => {
    const oct14 = new Date("2026-10-14T12:00:00Z");
    const oct21 = new Date("2026-10-21T12:00:00Z");
    const nov23 = new Date("2026-11-23T12:00:00Z");
    mockList.mockResolvedValue([
      bracketEdition({
        id: "official",
        kind: "official",
        weekId: null,
        weekNumber: null,
        publishedAt: nov23,
        updatedAt: null,
      }),
      bracketEdition({
        id: "week-8",
        weekNumber: 8,
        publishedAt: oct21,
        updatedAt: oct21,
      }),
      bracketEdition({ id: "week-7", publishedAt: oct14, updatedAt: oct14 }),
      bracketEdition({
        id: "2025",
        year: 2025,
        weekNumber: 12,
        publishedAt: null,
        updatedAt: null,
      }),
      bracketEdition({
        id: "2025-official",
        year: 2025,
        kind: "official",
        weekId: null,
        weekNumber: null,
        publishedAt: oct14,
        updatedAt: oct14,
      }),
      // Basketball formats have no division, so no bracket page.
      bracketEdition({ id: "hoops", divisionSlug: null }),
    ]);

    expect(await sitemap()).toEqual([
      {
        url: BASE,
        lastModified: nov23,
        changeFrequency: "weekly",
        priority: 0.8,
      },
      { url: `${BASE}/2026`, lastModified: nov23, priority: 0.7 },
      { url: `${BASE}/2025`, lastModified: oct14, priority: 0.7 },
      {
        url: `${BASE}/2026/projections/week-8`,
        lastModified: oct21,
        priority: 0.6,
      },
      {
        url: `${BASE}/2026/projections/week-7`,
        lastModified: oct14,
        priority: 0.6,
      },
      { url: `${BASE}/2025/projections/week-12`, priority: 0.6 },
      { url: `${BASE}/builder`, changeFrequency: "monthly", priority: 0.5 },
    ]);
  });
});
