# Public rankings API (v1)

Machine-readable Top 25 poll data for external consumers (news sites, conference offices, partners such as the NCAA). Backed by published `poll_rankings` — the same data as the public rankings pages.

**Base URL:** `https://www.redshirtsports.com`

No authentication. CORS allows `GET` / `OPTIONS` from any origin. Rate-limited to **60 requests per minute per IP**.

## Endpoints

### Latest published rankings

```http
GET /api/v1/college/{sport}/rankings/{division}
```

Resolves the most recently published week for that poll and returns it.

**Example (FCS Top 25):**

```http
GET /api/v1/college/football/rankings/fcs
```

### Specific season week

```http
GET /api/v1/college/{sport}/rankings/{division}/{year}/{week}
```

**Examples:**

```http
GET /api/v1/college/football/rankings/fcs/2025/5
GET /api/v1/college/football/rankings/fcs/2025/preseason
GET /api/v1/college/football/rankings/fcs/2025/0
GET /api/v1/college/football/rankings/fcs/2025/final-rankings
```

## Path parameters

| Param | Values | Notes |
| --- | --- | --- |
| `sport` | `football`, `mens-basketball`, `womens-basketball` | Must match an active sport |
| `division` | `fbs`, `fcs`, `d2`, `d3`, `mid-major`, `power-conferences` | Poll slug (e.g. FCS → `fcs`) |
| `year` | Season year integer | e.g. `2025` |
| `week` | Legacy week segment | See below |

### Week segments

Same convention as public rankings URLs. See [poll-weeks.md](./poll-weeks.md) for the full calendar model.

| Segment | Meaning |
| --- | --- |
| `preseason` or `0` | Preseason Top 25 |
| `1` … `N` | Regular-season Week N |
| `final-rankings` | Final Rankings (postseason) |

Unpublished weeks return **404** (including FCS weeks skipped during playoffs — we do not invent data).

## Response

`Content-Type: application/json`

Successful responses include:

- `Cache-Control: public, s-maxage=300, stale-while-revalidate=3600`
- `Access-Control-Allow-Origin: *`

### Shape

| Field | Description |
| --- | --- |
| `poll` | Sport, division slug, display name |
| `season.year` | Season year |
| `week` | Legacy number, label, URL segment, and calendar `weekKey` / season type |
| `sourceUrl` | Canonical human rankings page for attribution |
| `rankings` | Top 25 (ranks 1–25), including ties |
| `othersReceivingVotes` | Teams on **at least one ballot** outside the Top 25, ordered by points descending. `rank` is always `null`. |

Each ranking entry:

| Field | Description |
| --- | --- |
| `rank` | 1–25 in `rankings`; always `null` in `othersReceivingVotes` |
| `isTie` | Whether the team is tied on points with another |
| `points` | Aggregate ballot points (25 for a #1 vote … 1 for a #25 vote, summed across voters) |
| `firstPlaceVotes` | Count of ballots that ranked the team #1 |
| `school.id` | Stable Sanity document id |
| `school.name` / `shortName` / `abbreviation` / `slug` | Display identity |

Team win–loss records are **not** included.

### Example

```json
{
  "poll": {
    "sport": "football",
    "division": "fcs",
    "name": "FCS Top 25",
    "slug": "fcs"
  },
  "season": { "year": 2025 },
  "week": {
    "number": 5,
    "label": "Week 5",
    "segment": "5",
    "weekKey": "2-5",
    "seasonType": 2,
    "weekNumber": 5
  },
  "sourceUrl": "https://www.redshirtsports.com/college/football/rankings/fcs/2025/5",
  "rankings": [
    {
      "rank": 1,
      "isTie": false,
      "points": 1425,
      "firstPlaceVotes": 12,
      "school": {
        "id": "school-montana",
        "name": "Montana",
        "shortName": "Montana",
        "abbreviation": "MONT",
        "slug": "montana"
      }
    }
  ],
  "othersReceivingVotes": [
    {
      "rank": null,
      "isTie": false,
      "points": 18,
      "firstPlaceVotes": 0,
      "school": {
        "id": "school-eastern-washington",
        "name": "Eastern Washington",
        "shortName": "E. Washington",
        "abbreviation": "EWU",
        "slug": "eastern-washington"
      }
    }
  ]
}
```

## Errors

All errors are JSON: `{ "error": "<message>" }`.

| Status | When |
| --- | --- |
| `400` | Invalid sport, division, year, or week segment |
| `404` | Poll missing, or no published rankings for that week |
| `429` | Rate limit exceeded (60 req / min / IP) |
| `500` | Unexpected server error |

## Related code

- Routes: `apps/web/app/api/v1/college/[sport]/rankings/`
- Handler / DTO: `apps/web/lib/rankings-api.ts`, `apps/web/lib/rankings-api-route.ts`
- Data: `getFinalRankingsForWeekAndYear` / `getLatestFinalRankings` in `packages/db`
- Week semantics: [poll-weeks.md](./poll-weeks.md)
