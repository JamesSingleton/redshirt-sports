/**
 * Fixtures captured from live ESPN API responses.
 * Each export is the verbatim JSON body returned by the URL in its doc-comment.
 */

// ---------------------------------------------------------------------------
// /season  —  getCurrentSeason
// ---------------------------------------------------------------------------

/**
 * GET https://site.api.espn.com/apis/common/v3/sports/football/college-football/season
 */
export const footballCurrentSeason = {
  year: 2026,
  displayName: '2026',
  startDate: '2026-02-01T08:00:00.000+00:00',
  endDate: '2027-01-28T07:59:00.000+00:00',
  types: [
    {
      id: '1',
      type: 1,
      name: 'Preseason',
      startDate: '2026-02-01T08:00:00.000+00:00',
      endDate: '2026-08-29T06:59:00.000+00:00',
    },
    {
      id: '2',
      type: 2,
      name: 'Regular Season',
      startDate: '2026-08-29T07:00:00.000+00:00',
      endDate: '2026-12-12T07:59:00.000+00:00',
    },
    {
      id: '3',
      type: 3,
      name: 'Postseason',
      startDate: '2026-12-12T08:00:00.000+00:00',
      endDate: '2027-01-28T07:59:00.000+00:00',
    },
    {
      id: '4',
      type: 4,
      name: 'Off Season',
      startDate: '2027-01-28T08:00:00.000+00:00',
      endDate: '2027-02-01T07:59:00.000+00:00',
    },
  ],
}

/**
 * GET https://site.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/season
 */
export const mensBasketballCurrentSeason = {
  year: 2026,
  displayName: '2025-26',
  startDate: '2025-07-01T07:00:00.000+00:00',
  endDate: '2026-04-08T06:59:00.000+00:00',
  types: [
    {
      id: '1',
      type: 1,
      name: 'Preseason',
      startDate: '2025-07-01T07:00:00.000+00:00',
      endDate: '2025-11-03T07:59:00.000+00:00',
    },
    {
      id: '2',
      type: 2,
      name: 'Regular Season',
      startDate: '2025-11-03T08:00:00.000+00:00',
      endDate: '2026-03-17T06:59:00.000+00:00',
    },
    {
      id: '3',
      type: 3,
      name: 'Postseason',
      startDate: '2026-03-17T07:00:00.000+00:00',
      endDate: '2026-04-08T06:59:00.000+00:00',
    },
    {
      id: '4',
      type: 4,
      name: 'Off Season',
      startDate: '2026-04-08T07:00:00.000+00:00',
      endDate: '2026-07-13T06:59:00.000+00:00',
    },
  ],
}

/**
 * GET https://site.api.espn.com/apis/common/v3/sports/basketball/womens-college-basketball/season
 */
export const womensBasketballCurrentSeason = {
  year: 2026,
  displayName: '2025-26',
  startDate: '2025-07-01T07:00:00.000+00:00',
  endDate: '2026-04-08T06:59:00.000+00:00',
  types: [
    {
      id: '1',
      type: 1,
      name: 'Preseason',
      startDate: '2025-07-01T07:00:00.000+00:00',
      endDate: '2025-11-03T07:59:00.000+00:00',
    },
    {
      id: '2',
      type: 2,
      name: 'Regular Season',
      startDate: '2025-11-03T08:00:00.000+00:00',
      endDate: '2026-03-17T06:59:00.000+00:00',
    },
    {
      id: '3',
      type: 3,
      name: 'Postseason',
      startDate: '2026-03-17T07:00:00.000+00:00',
      endDate: '2026-04-08T06:59:00.000+00:00',
    },
    {
      id: '4',
      type: 4,
      name: 'Off Season',
      startDate: '2026-04-08T07:00:00.000+00:00',
      endDate: '2026-07-13T06:59:00.000+00:00',
    },
  ],
}

// ---------------------------------------------------------------------------
// /seasons  —  getSeasonData / getMultipleSeasonsData
// ---------------------------------------------------------------------------

/**
 * GET https://site.api.espn.com/apis/common/v3/sports/football/college-football/seasons?startingseason=2024
 *
 * Returns three seasons ordered newest-first.  getSeasonData always takes [0].
 */
export const footballSeasonsBody = {
  seasons: [
    {
      year: 2026,
      displayName: '2026',
      startDate: '2026-02-01T08:00:00.000+00:00',
      endDate: '2027-01-28T07:59:00.000+00:00',
      types: [
        {
          id: '1',
          type: 1,
          name: 'Preseason',
          startDate: '2026-02-01T08:00:00.000+00:00',
          endDate: '2026-08-29T06:59:00.000+00:00',
          weeks: [
            {
              number: 1,
              startDate: '2026-02-01T08:00:00.000+00:00',
              endDate: '2026-08-29T06:59:00.000+00:00',
              text: 'Week 1',
            },
          ],
          week: {
            number: 1,
            startDate: '2026-02-01T08:00:00.000+00:00',
            endDate: '2026-08-29T06:59:00.000+00:00',
            text: 'Week 1',
          },
        },
        {
          id: '2',
          type: 2,
          name: 'Regular Season',
          startDate: '2026-08-29T07:00:00.000+00:00',
          endDate: '2026-12-12T07:59:00.000+00:00',
          weeks: [
            { number: 1, startDate: '2026-08-29T07:00:00.000+00:00', endDate: '2026-09-08T06:59:00.000+00:00', text: 'Week 1' },
            { number: 2, startDate: '2026-09-08T07:00:00.000+00:00', endDate: '2026-09-14T06:59:00.000+00:00', text: 'Week 2' },
            { number: 3, startDate: '2026-09-14T07:00:00.000+00:00', endDate: '2026-09-21T06:59:00.000+00:00', text: 'Week 3' },
            { number: 4, startDate: '2026-09-21T07:00:00.000+00:00', endDate: '2026-09-28T06:59:00.000+00:00', text: 'Week 4' },
            { number: 5, startDate: '2026-09-28T07:00:00.000+00:00', endDate: '2026-10-05T06:59:00.000+00:00', text: 'Week 5' },
            { number: 6, startDate: '2026-10-05T07:00:00.000+00:00', endDate: '2026-10-12T06:59:00.000+00:00', text: 'Week 6' },
            { number: 7, startDate: '2026-10-12T07:00:00.000+00:00', endDate: '2026-10-19T06:59:00.000+00:00', text: 'Week 7' },
            { number: 8, startDate: '2026-10-19T07:00:00.000+00:00', endDate: '2026-10-26T06:59:00.000+00:00', text: 'Week 8' },
            { number: 9, startDate: '2026-10-26T07:00:00.000+00:00', endDate: '2026-11-02T07:59:00.000+00:00', text: 'Week 9' },
            { number: 10, startDate: '2026-11-02T08:00:00.000+00:00', endDate: '2026-11-09T07:59:00.000+00:00', text: 'Week 10' },
            { number: 11, startDate: '2026-11-09T08:00:00.000+00:00', endDate: '2026-11-16T07:59:00.000+00:00', text: 'Week 11' },
            { number: 12, startDate: '2026-11-16T08:00:00.000+00:00', endDate: '2026-11-23T07:59:00.000+00:00', text: 'Week 12' },
            { number: 13, startDate: '2026-11-23T08:00:00.000+00:00', endDate: '2026-11-30T07:59:00.000+00:00', text: 'Week 13' },
            { number: 14, startDate: '2026-11-30T08:00:00.000+00:00', endDate: '2026-12-07T07:59:00.000+00:00', text: 'Week 14' },
            { number: 15, startDate: '2026-12-07T08:00:00.000+00:00', endDate: '2026-12-12T07:59:00.000+00:00', text: 'Week 15' },
          ],
          week: {},
        },
        {
          id: '3',
          type: 3,
          name: 'Postseason',
          startDate: '2026-12-12T08:00:00.000+00:00',
          endDate: '2027-01-28T07:59:00.000+00:00',
          weeks: [
            { number: 1, startDate: '2026-12-12T08:00:00.000+00:00', endDate: '2027-01-28T07:59:00.000+00:00', text: 'Bowls' },
          ],
          week: {},
        },
        {
          id: '4',
          type: 4,
          name: 'Off Season',
          startDate: '2027-01-28T08:00:00.000+00:00',
          endDate: '2027-02-01T07:59:00.000+00:00',
          weeks: [
            { number: 1, startDate: '2027-01-28T08:00:00.000+00:00', endDate: '2027-02-01T07:59:00.000+00:00', text: 'All-Star' },
          ],
          week: {},
        },
      ],
    },
    {
      year: 2025,
      displayName: '2025',
      startDate: '2025-02-01T08:00:00.000+00:00',
      endDate: '2026-01-21T07:59:00.000+00:00',
      types: [
        {
          id: '1',
          type: 1,
          name: 'Preseason',
          startDate: '2025-02-01T08:00:00.000+00:00',
          endDate: '2025-08-23T06:59:00.000+00:00',
          weeks: [
            { number: 1, startDate: '2025-02-01T08:00:00.000+00:00', endDate: '2025-08-23T06:59:00.000+00:00', text: 'Week 1' },
          ],
          week: {},
        },
        {
          id: '2',
          type: 2,
          name: 'Regular Season',
          startDate: '2025-08-23T07:00:00.000+00:00',
          endDate: '2025-12-13T07:59:00.000+00:00',
          weeks: [
            { number: 1, startDate: '2025-08-23T07:00:00.000+00:00', endDate: '2025-09-02T06:59:00.000+00:00', text: 'Week 1' },
            { number: 2, startDate: '2025-09-02T07:00:00.000+00:00', endDate: '2025-09-08T06:59:00.000+00:00', text: 'Week 2' },
            { number: 3, startDate: '2025-09-08T07:00:00.000+00:00', endDate: '2025-09-15T06:59:00.000+00:00', text: 'Week 3' },
            { number: 4, startDate: '2025-09-15T07:00:00.000+00:00', endDate: '2025-09-22T06:59:00.000+00:00', text: 'Week 4' },
            { number: 5, startDate: '2025-09-22T07:00:00.000+00:00', endDate: '2025-09-29T06:59:00.000+00:00', text: 'Week 5' },
            { number: 6, startDate: '2025-09-29T07:00:00.000+00:00', endDate: '2025-10-06T06:59:00.000+00:00', text: 'Week 6' },
            { number: 7, startDate: '2025-10-06T07:00:00.000+00:00', endDate: '2025-10-13T06:59:00.000+00:00', text: 'Week 7' },
            { number: 8, startDate: '2025-10-13T07:00:00.000+00:00', endDate: '2025-10-20T06:59:00.000+00:00', text: 'Week 8' },
            { number: 9, startDate: '2025-10-20T07:00:00.000+00:00', endDate: '2025-10-27T06:59:00.000+00:00', text: 'Week 9' },
            { number: 10, startDate: '2025-10-27T07:00:00.000+00:00', endDate: '2025-11-03T07:59:00.000+00:00', text: 'Week 10' },
            { number: 11, startDate: '2025-11-03T08:00:00.000+00:00', endDate: '2025-11-10T07:59:00.000+00:00', text: 'Week 11' },
            { number: 12, startDate: '2025-11-10T08:00:00.000+00:00', endDate: '2025-11-17T07:59:00.000+00:00', text: 'Week 12' },
            { number: 13, startDate: '2025-11-17T08:00:00.000+00:00', endDate: '2025-11-24T07:59:00.000+00:00', text: 'Week 13' },
            { number: 14, startDate: '2025-11-24T08:00:00.000+00:00', endDate: '2025-12-01T07:59:00.000+00:00', text: 'Week 14' },
            { number: 15, startDate: '2025-12-01T08:00:00.000+00:00', endDate: '2025-12-08T07:59:00.000+00:00', text: 'Week 15' },
            { number: 16, startDate: '2025-12-08T08:00:00.000+00:00', endDate: '2025-12-13T07:59:00.000+00:00', text: 'Week 16' },
          ],
          week: {},
        },
        {
          id: '3',
          type: 3,
          name: 'Postseason',
          startDate: '2025-12-13T08:00:00.000+00:00',
          endDate: '2026-01-21T07:59:00.000+00:00',
          weeks: [
            { number: 1, startDate: '2025-12-13T08:00:00.000+00:00', endDate: '2026-01-21T07:59:00.000+00:00', text: 'Bowls' },
          ],
          week: {},
        },
        {
          id: '4',
          type: 4,
          name: 'Off Season',
          startDate: '2026-01-21T08:00:00.000+00:00',
          endDate: '2026-02-01T07:59:00.000+00:00',
          weeks: [
            { number: 1, startDate: '2026-01-21T08:00:00.000+00:00', endDate: '2026-02-01T07:59:00.000+00:00', text: 'All-Star' },
          ],
          week: {},
        },
      ],
    },
    {
      year: 2024,
      displayName: '2024',
      startDate: '2024-07-01T07:00:00.000+00:00',
      endDate: '2025-01-22T07:59:00.000+00:00',
      types: [
        {
          id: '1',
          type: 1,
          name: 'Preseason',
          startDate: '2024-07-01T07:00:00.000+00:00',
          endDate: '2024-08-24T06:59:00.000+00:00',
          weeks: [
            { number: 1, startDate: '2024-07-01T07:00:00.000+00:00', endDate: '2024-08-24T06:59:00.000+00:00', text: 'Week 1' },
          ],
          week: {},
        },
        {
          id: '2',
          type: 2,
          name: 'Regular Season',
          startDate: '2024-08-24T07:00:00.000+00:00',
          endDate: '2024-12-15T07:59:00.000+00:00',
          weeks: [
            { number: 1, startDate: '2024-08-24T07:00:00.000+00:00', endDate: '2024-09-03T06:59:00.000+00:00', text: 'Week 1' },
            { number: 2, startDate: '2024-09-03T07:00:00.000+00:00', endDate: '2024-09-09T06:59:00.000+00:00', text: 'Week 2' },
            { number: 3, startDate: '2024-09-09T07:00:00.000+00:00', endDate: '2024-09-16T06:59:00.000+00:00', text: 'Week 3' },
            { number: 4, startDate: '2024-09-16T07:00:00.000+00:00', endDate: '2024-09-23T06:59:00.000+00:00', text: 'Week 4' },
            { number: 5, startDate: '2024-09-23T07:00:00.000+00:00', endDate: '2024-09-30T06:59:00.000+00:00', text: 'Week 5' },
            { number: 6, startDate: '2024-09-30T07:00:00.000+00:00', endDate: '2024-10-07T06:59:00.000+00:00', text: 'Week 6' },
            { number: 7, startDate: '2024-10-07T07:00:00.000+00:00', endDate: '2024-10-14T06:59:00.000+00:00', text: 'Week 7' },
            { number: 8, startDate: '2024-10-14T07:00:00.000+00:00', endDate: '2024-10-21T06:59:00.000+00:00', text: 'Week 8' },
            { number: 9, startDate: '2024-10-21T07:00:00.000+00:00', endDate: '2024-10-28T06:59:00.000+00:00', text: 'Week 9' },
            { number: 10, startDate: '2024-10-28T07:00:00.000+00:00', endDate: '2024-11-04T07:59:00.000+00:00', text: 'Week 10' },
            { number: 11, startDate: '2024-11-04T08:00:00.000+00:00', endDate: '2024-11-11T07:59:00.000+00:00', text: 'Week 11' },
            { number: 12, startDate: '2024-11-11T08:00:00.000+00:00', endDate: '2024-11-18T07:59:00.000+00:00', text: 'Week 12' },
            { number: 13, startDate: '2024-11-18T08:00:00.000+00:00', endDate: '2024-11-25T07:59:00.000+00:00', text: 'Week 13' },
            { number: 14, startDate: '2024-11-25T08:00:00.000+00:00', endDate: '2024-12-02T07:59:00.000+00:00', text: 'Week 14' },
            { number: 15, startDate: '2024-12-02T08:00:00.000+00:00', endDate: '2024-12-09T07:59:00.000+00:00', text: 'Week 15' },
            { number: 16, startDate: '2024-12-09T08:00:00.000+00:00', endDate: '2024-12-14T07:59:00.000+00:00', text: 'Week 16' },
          ],
          week: {},
        },
        {
          id: '3',
          type: 3,
          name: 'Postseason',
          startDate: '2024-12-15T08:00:00.000+00:00',
          endDate: '2025-01-22T07:59:00.000+00:00',
          weeks: [
            // Note: week startDate is Dec 14 while the type startDate is Dec 15 — as returned by ESPN.
            { number: 1, startDate: '2024-12-14T08:00:00.000+00:00', endDate: '2025-01-22T07:59:00.000+00:00', text: 'Bowls' },
          ],
          week: {},
        },
        {
          id: '4',
          type: 4,
          name: 'Off Season',
          startDate: '2025-01-22T08:00:00.000+00:00',
          endDate: '2025-02-01T07:59:00.000+00:00',
          weeks: [
            { number: 1, startDate: '2025-01-22T08:00:00.000+00:00', endDate: '2025-02-01T07:59:00.000+00:00', text: 'All-Star' },
          ],
          week: {},
        },
      ],
    },
  ],
}

// ---------------------------------------------------------------------------
// /weeks  —  fetchWeeksFromSportsUrl
// ---------------------------------------------------------------------------

/**
 * GET https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks
 */
export const footballRegularSeasonWeeksList = {
  count: 16,
  pageIndex: 1,
  pageSize: 25,
  pageCount: 1,
  items: [
    { $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/1?lang=en&region=us' },
    { $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/2?lang=en&region=us' },
    { $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/3?lang=en&region=us' },
    { $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/4?lang=en&region=us' },
    { $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/5?lang=en&region=us' },
    { $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/6?lang=en&region=us' },
    { $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/7?lang=en&region=us' },
    { $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/8?lang=en&region=us' },
    { $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/9?lang=en&region=us' },
    { $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/10?lang=en&region=us' },
    { $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/11?lang=en&region=us' },
    { $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/12?lang=en&region=us' },
    { $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/13?lang=en&region=us' },
    { $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/14?lang=en&region=us' },
    { $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/15?lang=en&region=us' },
    { $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/16?lang=en&region=us' },
  ],
}

/**
 * GET http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/1?lang=en&region=us
 */
export const footballWeek1Detail = {
  $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/1?lang=en&region=us',
  number: 1,
  startDate: '2024-08-24T07:00Z',
  endDate: '2024-09-03T06:59Z',
  text: 'Week 1',
  rankings: {
    $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/1/rankings?lang=en&region=us',
  },
  qbr: {
    $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/1/qbr/10000?lang=en&region=us',
  },
}

/**
 * GET http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/2?lang=en&region=us
 */
export const footballWeek2Detail = {
  $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/2?lang=en&region=us',
  number: 2,
  startDate: '2024-09-03T07:00Z',
  endDate: '2024-09-09T06:59Z',
  text: 'Week 2',
  rankings: {
    $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/2/rankings?lang=en&region=us',
  },
  qbr: {
    $ref: 'http://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/2024/types/2/weeks/2/qbr/10000?lang=en&region=us',
  },
}
