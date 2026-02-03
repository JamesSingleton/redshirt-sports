import {
  SportSchema,
  isDateInSeasonPeriod,
  getWeekForDate,
  getCurrentSeason,
  getSeasonData,
  getMultipleSeasonsData,
  getCurrentWeek,
  getSeasonInfo,
  getSeasonWeeks,
  fetchWeeksFromSportsUrl,
} from '../api'
import {
  footballCurrentSeason,
  mensBasketballCurrentSeason,
  womensBasketballCurrentSeason,
  footballSeasonsBody,
  footballRegularSeasonWeeksList,
  footballWeek1Detail,
  footballWeek2Detail,
} from './fixtures'

// ---------------------------------------------------------------------------
// Derived constants — pulled from the fixture so test dates stay in sync
// ---------------------------------------------------------------------------

const season2026 = footballSeasonsBody.seasons[0]!
const preseason2026 = season2026.types.find((t) => t.type === 1)!
const regularSeason2026 = season2026.types.find((t) => t.type === 2)!
const postseason2026 = season2026.types.find((t) => t.type === 3)!

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function mockJsonResponse(data: unknown, ok = true) {
  return { ok, statusText: ok ? 'OK' : 'Not Found', json: () => Promise.resolve(data) }
}

// ---------------------------------------------------------------------------
// SportSchema
// ---------------------------------------------------------------------------

describe('SportSchema', () => {
  it('accepts all valid sport values', () => {
    expect(SportSchema.parse('football')).toBe('football')
    expect(SportSchema.parse('mens-basketball')).toBe('mens-basketball')
    expect(SportSchema.parse('womens-basketball')).toBe('womens-basketball')
  })

  it('rejects an invalid sport', () => {
    expect(() => SportSchema.parse('soccer')).toThrow()
  })

  it('rejects an empty string', () => {
    expect(() => SportSchema.parse('')).toThrow()
  })
})

// ---------------------------------------------------------------------------
// isDateInSeasonPeriod  (pure)
// ---------------------------------------------------------------------------

describe('isDateInSeasonPeriod', () => {
  // 2026 regular season: Aug 29 07:00 … Dec 12 07:59 UTC

  it('returns true for a date within the period', () => {
    expect(isDateInSeasonPeriod(new Date('2026-10-01T12:00:00.000Z'), regularSeason2026)).toBe(true)
  })

  it('returns false for a date before the period', () => {
    expect(isDateInSeasonPeriod(new Date('2026-07-01T00:00:00.000Z'), regularSeason2026)).toBe(
      false,
    )
  })

  it('returns false for a date after the period', () => {
    expect(isDateInSeasonPeriod(new Date('2027-02-01T00:00:00.000Z'), regularSeason2026)).toBe(
      false,
    )
  })

  it('returns true at the exact start boundary', () => {
    expect(isDateInSeasonPeriod(new Date(regularSeason2026.startDate), regularSeason2026)).toBe(
      true,
    )
  })

  it('returns true at the exact end boundary', () => {
    expect(isDateInSeasonPeriod(new Date(regularSeason2026.endDate), regularSeason2026)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getWeekForDate  (pure)
// ---------------------------------------------------------------------------

describe('getWeekForDate', () => {
  // 2026 weeks: 1 (Aug 29–Sep 8), 2 (Sep 8–Sep 14), 3 (Sep 14–Sep 21), …

  it('returns the correct week number', () => {
    expect(getWeekForDate(new Date('2026-09-01T12:00:00.000Z'), regularSeason2026)).toBe(1)
    expect(getWeekForDate(new Date('2026-09-10T12:00:00.000Z'), regularSeason2026)).toBe(2)
    expect(getWeekForDate(new Date('2026-09-17T12:00:00.000Z'), regularSeason2026)).toBe(3)
  })

  it('returns null for a date that falls in no defined week', () => {
    // Keep only week 1 so Sep 10 (normally week 2) has no match
    const oneWeek = { ...regularSeason2026, weeks: regularSeason2026.weeks!.slice(0, 1) }
    expect(getWeekForDate(new Date('2026-09-10T12:00:00.000Z'), oneWeek)).toBe(null)
  })

  it('returns null when weeks is undefined', () => {
    const noWeeks = { ...regularSeason2026, weeks: undefined }
    expect(getWeekForDate(new Date('2026-09-01T12:00:00.000Z'), noWeeks)).toBe(null)
  })
})

// ---------------------------------------------------------------------------
// Async functions — fetch is stubbed for every test below
// ---------------------------------------------------------------------------

let mockFetch: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockFetch = vi.fn()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// getCurrentSeason
// ---------------------------------------------------------------------------

describe('getCurrentSeason', () => {
  it('constructs the correct URL for each sport and returns the response', async () => {
    const cases = [
      {
        sport: 'football' as const,
        fixture: footballCurrentSeason,
        url: 'https://site.api.espn.com/apis/common/v3/sports/football/college-football/season',
      },
      {
        sport: 'mens-basketball' as const,
        fixture: mensBasketballCurrentSeason,
        url: 'https://site.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/season',
      },
      {
        sport: 'womens-basketball' as const,
        fixture: womensBasketballCurrentSeason,
        url: 'https://site.api.espn.com/apis/common/v3/sports/basketball/womens-college-basketball/season',
      },
    ]

    for (const { sport, fixture, url } of cases) {
      mockFetch.mockResolvedValueOnce(mockJsonResponse(fixture))

      const result = await getCurrentSeason(sport)

      expect(mockFetch).toHaveBeenLastCalledWith(url)
      expect(result).toEqual(fixture)
    }
  })

  it('throws on a non-ok HTTP response', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(null, false))
    await expect(getCurrentSeason()).rejects.toThrow('ESPN API request failed: Not Found')
  })
})

// ---------------------------------------------------------------------------
// getSeasonData
// ---------------------------------------------------------------------------

describe('getSeasonData', () => {
  it('fetches directly when a year is provided (single fetch)', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(footballSeasonsBody))

    const result = await getSeasonData('football', 2024)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://site.api.espn.com/apis/common/v3/sports/football/college-football/seasons?startingseason=2024',
    )
    // ESPN returns seasons newest-first; the function takes [0]
    expect(result).toEqual(season2026)
  })

  it('fetches current season first to resolve the year when none is given', async () => {
    mockFetch
      .mockResolvedValueOnce(mockJsonResponse(footballCurrentSeason)) // getCurrentSeason → year 2026
      .mockResolvedValueOnce(mockJsonResponse(footballSeasonsBody)) // seasons endpoint

    const result = await getSeasonData('football')

    expect(mockFetch).toHaveBeenCalledTimes(2)
    // Second call uses the year from footballCurrentSeason
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      `https://site.api.espn.com/apis/common/v3/sports/football/college-football/seasons?startingseason=${footballCurrentSeason.year}`,
    )
    expect(result).toEqual(season2026)
  })
})

// ---------------------------------------------------------------------------
// getMultipleSeasonsData
// ---------------------------------------------------------------------------

describe('getMultipleSeasonsData', () => {
  it('returns the full seasons array', async () => {
    mockFetch.mockResolvedValueOnce(mockJsonResponse(footballSeasonsBody))

    const result = await getMultipleSeasonsData('football', 2024)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://site.api.espn.com/apis/common/v3/sports/football/college-football/seasons?startingseason=2024',
    )
    expect(result).toEqual(footballSeasonsBody.seasons)
    expect(result).toHaveLength(3) // 2026, 2025, 2024
  })
})

// ---------------------------------------------------------------------------
// getCurrentWeek  (date-sensitive — uses fake timers)
// ---------------------------------------------------------------------------

describe('getCurrentWeek', () => {
  // getCurrentWeek → getSeasonData(sport) without year → 2 fetches
  function stubSeasonData(season = season2026) {
    mockFetch
      .mockResolvedValueOnce(mockJsonResponse(footballCurrentSeason)) // getCurrentSeason
      .mockResolvedValueOnce(mockJsonResponse({ seasons: [season] })) // seasons endpoint
  }

  it('returns 0 during preseason', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00.000Z'))
    stubSeasonData()

    expect(await getCurrentWeek()).toBe(0)
  })

  it('returns the matching week number during regular season', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-01T12:00:00.000Z')) // falls in week 1 (Aug 29 – Sep 8)
    stubSeasonData()

    expect(await getCurrentWeek()).toBe(1)
  })

  it('returns 999 during postseason', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-12-20T12:00:00.000Z'))
    stubSeasonData()

    expect(await getCurrentWeek()).toBe(999)
  })

  it('returns 0 when the season has no types', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-01T12:00:00.000Z'))
    stubSeasonData({ ...season2026, types: [] })

    expect(await getCurrentWeek()).toBe(0)
  })

  it('returns 0 when preseason or regularSeason type is missing', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-01T12:00:00.000Z'))
    // Only postseason present — neither type 1 nor type 2
    stubSeasonData({ ...season2026, types: [postseason2026] })

    expect(await getCurrentWeek()).toBe(0)
  })

  it('returns 0 when the date is in regular season but matches no defined week', async () => {
    vi.useFakeTimers()
    // Sep 25 is after week 3 ends (Sep 21) but before regular season ends (Dec 12)
    vi.setSystemTime(new Date('2026-09-25T12:00:00.000Z'))

    // Trim regular season to only weeks 1–3 so there is a gap
    const seasonWithGap = {
      ...season2026,
      types: season2026.types.map((t) =>
        t.type === 2 ? { ...t, weeks: t.weeks!.slice(0, 3) } : t,
      ),
    }
    stubSeasonData(seasonWithGap)

    expect(await getCurrentWeek()).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// getSeasonInfo  (date-sensitive — uses fake timers)
// ---------------------------------------------------------------------------

describe('getSeasonInfo', () => {
  function stubSeasonData(season = season2026) {
    mockFetch
      .mockResolvedValueOnce(mockJsonResponse(footballCurrentSeason))
      .mockResolvedValueOnce(mockJsonResponse({ seasons: [season] }))
  }

  it('identifies preseason', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-15T12:00:00.000Z'))
    stubSeasonData()

    const info = await getSeasonInfo()

    expect(info).toMatchObject({
      year: 2026,
      currentWeek: 0,
      isPreseason: true,
      isRegularSeason: false,
      isPostseason: false,
    })
  })

  it('identifies regular season and resolves the current week', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00.000Z')) // week 2 (Sep 8 – Sep 14)
    stubSeasonData()

    const info = await getSeasonInfo()

    expect(info).toMatchObject({
      year: 2026,
      currentWeek: 2,
      isPreseason: false,
      isRegularSeason: true,
      isPostseason: false,
    })
  })

  it('identifies postseason', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-12-20T12:00:00.000Z'))
    stubSeasonData()

    const info = await getSeasonInfo()

    expect(info).toMatchObject({
      year: 2026,
      currentWeek: 999,
      isPreseason: false,
      isRegularSeason: false,
      isPostseason: true,
    })
  })

  it('includes the preseason and regularSeason SeasonType objects', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-10T12:00:00.000Z'))
    stubSeasonData()

    const info = await getSeasonInfo()

    expect(info.preseason).toEqual(preseason2026)
    expect(info.regularSeason).toEqual(regularSeason2026)
  })
})

// ---------------------------------------------------------------------------
// getSeasonWeeks
// ---------------------------------------------------------------------------

describe('getSeasonWeeks', () => {
  it('organizes weeks by season phase', async () => {
    // year provided → getSeasonData makes only 1 fetch
    mockFetch.mockResolvedValueOnce(mockJsonResponse(footballSeasonsBody))

    const result = await getSeasonWeeks('football', 2024)

    expect(result).toEqual({
      preseason: preseason2026.weeks,
      regularSeason: regularSeason2026.weeks,
      postseason: postseason2026.weeks,
    })
  })

  it('returns empty arrays when no season type has weeks', async () => {
    const noWeeks = {
      ...footballSeasonsBody,
      seasons: [
        { ...season2026, types: season2026.types.map((t) => ({ ...t, weeks: undefined })) },
      ],
    }
    mockFetch.mockResolvedValueOnce(mockJsonResponse(noWeeks))

    const result = await getSeasonWeeks('football', 2024)

    expect(result).toEqual({ preseason: [], regularSeason: [], postseason: [] })
  })
})

// ---------------------------------------------------------------------------
// fetchWeeksFromSportsUrl
// ---------------------------------------------------------------------------

describe('fetchWeeksFromSportsUrl', () => {
  it('fetches the week list then fetches each week detail', async () => {
    // Slice the real 16-item list down to 2 so we only need 3 total mock responses
    const twoWeeksList = {
      ...footballRegularSeasonWeeksList,
      count: 2,
      items: footballRegularSeasonWeeksList.items.slice(0, 2),
    }

    mockFetch
      .mockResolvedValueOnce(mockJsonResponse(twoWeeksList))
      .mockResolvedValueOnce(mockJsonResponse(footballWeek1Detail))
      .mockResolvedValueOnce(mockJsonResponse(footballWeek2Detail))

    const result = await fetchWeeksFromSportsUrl('football', 2024, 2)

    // 1st call: URL constructed by the code
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      'https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks',
    )
    // 2nd & 3rd calls: the exact $ref URLs that the fixture returned
    expect(mockFetch).toHaveBeenNthCalledWith(2, twoWeeksList.items[0]!.$ref)
    expect(mockFetch).toHaveBeenNthCalledWith(3, twoWeeksList.items[1]!.$ref)

    expect(result).toEqual([footballWeek1Detail, footballWeek2Detail])
  })

  it('returns an empty array when the weeks list has no items', async () => {
    const emptyList = { ...footballRegularSeasonWeeksList, count: 0, items: [] }
    mockFetch.mockResolvedValueOnce(mockJsonResponse(emptyList))

    const result = await fetchWeeksFromSportsUrl('football', 2024, 2)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result).toEqual([])
  })
})
