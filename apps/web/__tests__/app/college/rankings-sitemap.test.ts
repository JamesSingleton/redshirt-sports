import sitemap, {
  generateSitemaps,
} from "@/app/college/[sport]/rankings/sitemap";

const { mockGetYearsWithVotes } = vi.hoisted(() => ({
  mockGetYearsWithVotes: vi.fn(),
}));

vi.mock("@redshirt-sports/db/queries", () => ({
  getYearsWithVotes: mockGetYearsWithVotes,
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

describe("college rankings sitemap", () => {
  beforeEach(() => {
    mockGetYearsWithVotes.mockReset();
  });

  it("exposes a single sitemap id", () => {
    expect(generateSitemaps()).toEqual([{ id: 0 }]);
  });

  it("formats preseason, regular, and final-rankings week segments", async () => {
    mockGetYearsWithVotes.mockResolvedValue([
      { year: 2025, week: 0, division: "fbs" },
      { year: 2025, week: 3, division: "fcs" },
      { year: 2024, week: 999, division: "d2" },
    ]);

    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls).toContain(
      "https://redshirtsports.com/college/football/rankings",
    );
    expect(urls).toContain(
      "https://redshirtsports.com/college/football/rankings/fbs/2025/0",
    );
    expect(urls).toContain(
      "https://redshirtsports.com/college/football/rankings/fbs/2025/0/ballots",
    );
    expect(urls).toContain(
      "https://redshirtsports.com/college/football/rankings/fcs/2025/3",
    );
    expect(urls).toContain(
      "https://redshirtsports.com/college/football/rankings/d2/2024/final-rankings",
    );
    expect(urls).toContain(
      "https://redshirtsports.com/college/football/rankings/fbs/voters",
    );
    expect(urls).toContain(
      "https://redshirtsports.com/college/football/rankings/fcs/history",
    );
    expect(urls).toContain(
      "https://redshirtsports.com/college/football/rankings/d2/methodology",
    );
  });
});
