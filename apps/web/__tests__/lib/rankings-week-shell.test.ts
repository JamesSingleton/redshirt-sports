const {
  mockGetCachedYearsThatHaveVotes,
  mockGetCachedWeeksThatHaveVotes,
  mockSanityFetchPage,
  mockGetCachedLatestFinalRankingsBySportSlug,
  mockNotFound,
} = vi.hoisted(() => ({
  mockGetCachedYearsThatHaveVotes: vi.fn(),
  mockGetCachedWeeksThatHaveVotes: vi.fn(),
  mockSanityFetchPage: vi.fn(),
  mockGetCachedLatestFinalRankingsBySportSlug: vi.fn(),
  mockNotFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("next/cache", () => ({
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

vi.mock("@/lib/rankings-data", () => ({
  getCachedYearsThatHaveVotes: mockGetCachedYearsThatHaveVotes,
  getCachedWeeksThatHaveVotes: mockGetCachedWeeksThatHaveVotes,
  getCachedLatestFinalRankingsBySportSlug:
    mockGetCachedLatestFinalRankingsBySportSlug,
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

import { beforeEach, describe, expect, it } from "vitest";

import {
  loadRankingsDivisionShell,
  loadRankingsWeekShell,
} from "@/lib/rankings-week-shell";

describe("rankings week shell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCachedYearsThatHaveVotes.mockResolvedValue([2026]);
    mockGetCachedWeeksThatHaveVotes.mockResolvedValue([{ week: 7 }]);
    mockSanityFetchPage.mockResolvedValue({ data: { title: "Football" } });
  });

  it("loadRankingsWeekShell returns shell data", async () => {
    const shell = await loadRankingsWeekShell({
      sport: "football",
      division: "fbs",
      year: "2026",
      week: "7",
    });
    expect(shell.divisionName).toBe("FBS");
    expect(shell.tabs).toHaveLength(5);
    expect(shell.ballotsHref).toContain("/ballots");
  });

  it("falls back to sport slug when Sanity title is missing", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: {} });
    const shell = await loadRankingsWeekShell({
      sport: "football",
      division: "fbs",
      year: "2026",
      week: "7",
    });
    expect(shell.sportLabel).toBe("College Football");
  });

  it("throws notFound when no vote weeks exist", async () => {
    mockGetCachedYearsThatHaveVotes.mockResolvedValue([]);
    await expect(
      loadRankingsWeekShell({
        sport: "football",
        division: "fbs",
        year: "2026",
        week: "7",
      }),
    ).rejects.toThrow("NOT_FOUND");
  });

  it("loadRankingsDivisionShell redirects to latest week", async () => {
    mockGetCachedLatestFinalRankingsBySportSlug.mockResolvedValue([
      { division: "fbs", year: 2026, week: 7 },
    ]);
    const shell = await loadRankingsDivisionShell({
      sport: "football",
      division: "fbs",
    });
    expect(shell.yearNumber).toBe(2026);
    expect(shell.weekNumber).toBe(7);
  });

  it("throws notFound when division has no rankings", async () => {
    mockGetCachedLatestFinalRankingsBySportSlug.mockResolvedValue([]);
    await expect(
      loadRankingsDivisionShell({ sport: "football", division: "fbs" }),
    ).rejects.toThrow("NOT_FOUND");
  });
});
