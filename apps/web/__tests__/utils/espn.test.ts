import type { Season, SeasonType } from "@/types";
import {
  fetchWeeksFromSportsUrl,
  getCurrentSeason,
  getCurrentWeek,
  getMultipleSeasonsData,
  getSeasonData,
  getSeasonInfo,
  getSeasonWeeks,
  getWeekForDate,
  isDateInSeasonPeriod,
} from "@/utils/espn";

const regularSeason: SeasonType = {
  id: "2",
  type: 2,
  name: "Regular Season",
  startDate: "2025-08-30T00:00:00Z",
  endDate: "2025-12-07T00:00:00Z",
  week: {},
  weeks: [
    {
      number: 1,
      startDate: "2025-08-30T00:00:00Z",
      endDate: "2025-09-07T00:00:00Z",
      text: "Week 1",
    },
    {
      number: 2,
      startDate: "2025-09-07T00:00:00Z",
      endDate: "2025-09-14T00:00:00Z",
      text: "Week 2",
    },
  ],
};

const preseason: SeasonType = {
  id: "1",
  type: 1,
  name: "Preseason",
  startDate: "2025-08-01T00:00:00Z",
  endDate: "2025-08-29T00:00:00Z",
  week: {},
};

const postseason: SeasonType = {
  id: "3",
  type: 3,
  name: "Postseason",
  startDate: "2025-12-08T00:00:00Z",
  endDate: "2026-01-15T00:00:00Z",
  week: {},
  weeks: [],
};

const mockSeason: Season = {
  year: 2025,
  displayName: "2025",
  startDate: "2025-08-01T00:00:00Z",
  endDate: "2026-01-15T00:00:00Z",
  types: [preseason, regularSeason, postseason],
};

function mockFetchResponse(data: unknown, ok = true) {
  return {
    ok,
    statusText: ok ? "OK" : "Not Found",
    json: async () => data,
  } as Response;
}

describe("isDateInSeasonPeriod", () => {
  it("returns true when the date falls within the season period", () => {
    const date = new Date("2025-09-10T12:00:00Z");

    expect(isDateInSeasonPeriod(date, regularSeason)).toBe(true);
  });

  it("returns false when the date is before the season starts", () => {
    const date = new Date("2025-08-01T12:00:00Z");

    expect(isDateInSeasonPeriod(date, regularSeason)).toBe(false);
  });

  it("returns false when the date is after the season ends", () => {
    const date = new Date("2025-12-20T12:00:00Z");

    expect(isDateInSeasonPeriod(date, regularSeason)).toBe(false);
  });
});

describe("getWeekForDate", () => {
  it("returns the matching week number for a date inside a week", () => {
    const date = new Date("2025-09-10T12:00:00Z");

    expect(getWeekForDate(date, regularSeason)).toBe(2);
  });

  it("returns null when no week matches the date", () => {
    const date = new Date("2025-12-20T12:00:00Z");

    expect(getWeekForDate(date, regularSeason)).toBeNull();
  });
});

describe("ESPN API helpers", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-09-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("fetches the current season", async () => {
    fetchMock.mockResolvedValueOnce(mockFetchResponse(mockSeason));

    await expect(getCurrentSeason()).resolves.toEqual(mockSeason);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://site.api.espn.com/apis/common/v3/sports/football/college-football/season",
    );
  });

  it("fetches season data for a provided year", async () => {
    fetchMock.mockResolvedValueOnce(
      mockFetchResponse({ seasons: [mockSeason] }),
    );

    await expect(getSeasonData("football", 2025)).resolves.toEqual(mockSeason);
  });

  it("fetches the current season year when year is omitted", async () => {
    fetchMock
      .mockResolvedValueOnce(mockFetchResponse(mockSeason))
      .mockResolvedValueOnce(mockFetchResponse({ seasons: [mockSeason] }));

    await expect(getSeasonData("football")).resolves.toEqual(mockSeason);
  });

  it("throws when season data cannot be found", async () => {
    fetchMock.mockResolvedValueOnce(
      mockFetchResponse({ seasons: [{ ...mockSeason, year: 2024 }] }),
    );

    await expect(getSeasonData("football", 2025)).rejects.toThrow(
      "Unable to find a season for year 2025",
    );
  });

  it("throws when the ESPN API responds with an error", async () => {
    fetchMock.mockResolvedValueOnce(mockFetchResponse(null, false));

    await expect(getCurrentSeason()).rejects.toThrow(
      "ESPN API request failed: Not Found",
    );
  });

  it("fetches multiple seasons from a starting year", async () => {
    fetchMock.mockResolvedValueOnce(
      mockFetchResponse({ seasons: [mockSeason, { ...mockSeason, year: 2024 }] }),
    );

    await expect(getMultipleSeasonsData("football", 2024)).resolves.toHaveLength(2);
  });

  it("fetches week details from the sports core API", async () => {
    fetchMock
      .mockResolvedValueOnce(
        mockFetchResponse({
          items: [{ $ref: "https://sports.core.api.espn.com/week/1" }],
        }),
      )
      .mockResolvedValueOnce(
        mockFetchResponse({
          number: 1,
          startDate: "2025-08-30T00:00:00Z",
          endDate: "2025-09-07T00:00:00Z",
          text: "Week 1",
        }),
      );

    await expect(fetchWeeksFromSportsUrl("football", 2025, 2)).resolves.toEqual([
      {
        number: 1,
        startDate: "2025-08-30T00:00:00Z",
        endDate: "2025-09-07T00:00:00Z",
        text: "Week 1",
      },
    ]);
  });

  function mockCurrentSeasonFlow(season: Season) {
    fetchMock
      .mockResolvedValueOnce(mockFetchResponse(season))
      .mockResolvedValueOnce(mockFetchResponse({ seasons: [season] }));
  }

  it("returns the current regular-season week", async () => {
    mockCurrentSeasonFlow(mockSeason);

    await expect(getCurrentWeek("football")).resolves.toBe(2);
  });

  it("returns 999 during postseason", async () => {
    vi.setSystemTime(new Date("2025-12-20T12:00:00Z"));
    mockCurrentSeasonFlow(mockSeason);

    await expect(getCurrentWeek("football")).resolves.toBe(999);
  });

  it("returns 0 when season types are missing", async () => {
    mockCurrentSeasonFlow({ ...mockSeason, types: [] });

    await expect(getCurrentWeek("football")).resolves.toBe(0);
  });

  it("returns 0 when preseason or regular season types are missing", async () => {
    mockCurrentSeasonFlow({ ...mockSeason, types: [postseason] });

    await expect(getCurrentWeek("football")).resolves.toBe(0);
  });

  it("returns 0 during preseason", async () => {
    vi.setSystemTime(new Date("2025-08-15T12:00:00Z"));
    mockCurrentSeasonFlow(mockSeason);

    await expect(getCurrentWeek("football")).resolves.toBe(0);
  });

  it("returns season info for the current date", async () => {
    mockCurrentSeasonFlow(mockSeason);

    await expect(getSeasonInfo("football")).resolves.toEqual({
      year: 2025,
      currentWeek: 2,
      isPreseason: false,
      isRegularSeason: true,
      isPostseason: false,
      preseason,
      regularSeason,
    });
  });

  it("returns postseason info and week 999", async () => {
    vi.setSystemTime(new Date("2025-12-20T12:00:00Z"));
    mockCurrentSeasonFlow(mockSeason);

    await expect(getSeasonInfo("football")).resolves.toMatchObject({
      currentWeek: 999,
      isPostseason: true,
      isRegularSeason: false,
    });
  });

  it("returns grouped season weeks", async () => {
    fetchMock.mockResolvedValueOnce(
      mockFetchResponse({ seasons: [mockSeason] }),
    );

    await expect(getSeasonWeeks("football", 2025)).resolves.toEqual({
      preseason: [],
      regularSeason: regularSeason.weeks,
      postseason: [],
    });
  });

  it("throws for unsupported sports at runtime", async () => {
    await expect(getCurrentSeason("invalid-sport" as "football")).rejects.toThrow(
      "Unsupported sport: invalid-sport",
    );
  });

  it("supports basketball sport mappings", async () => {
    fetchMock.mockResolvedValueOnce(mockFetchResponse(mockSeason));

    await getCurrentSeason("mens-basketball");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://site.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/season",
    );
  });
});
