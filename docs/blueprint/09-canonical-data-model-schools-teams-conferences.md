## 9. Canonical data model: schools, teams, conferences, seasons

### 9.1 Identity rules

| Concept | Canonical key | Example |
|---|---|---|
| School | `schools.id` (`uuid`) + immutable `slug` | `slug = 'montana-state'` |
| Team | (`school_id`, `sport`) → `teams.id` | Montana State football; Montana State women's basketball |
| Sport | short code | `cfb`, `mbb`, `wbb` |
| Division | short code per sport | football: `fbs`, `fcs`, `d2`, `d3`, `naia`; basketball: `d1`, `d2`, `d3` |
| Season | `seasons.id` = (`sport`, `year`) | `cfb-2026`; basketball display `2026-27` |
| Week | (`season_id`, `week_number`) + `season_type` | Used by poll weeks; not a sports-data schedule |
| Conference | `conferences.id` + slug; membership per season | Realignment via `team_seasons` |
| Bracket event | unique (`sport`, `division`, `season_id`) | One FCS 2026 challenge, one CFP/FBS 2026 challenge, etc. |

**Division is a team-season attribute**, not a school attribute: schools reclassify. `team_seasons(team_id, season_id, division, conference_id)` captures it.

There are **no `games`, `players`, or `roster` entities**. Schedules, scores and rosters are outbound links on hubs (§15). Bracket games are rows in `bracket_games` only (format slots + admin-entered winners), not linked to a sports feed.

### 9.2 Manual / editorial IDs

Schools and conferences are created in admin (or a one-time seed) and linked to Sanity. A small `provider_ids` table is optional for **importing historical poll data** that used ESPN/CFBD school ids — not for live feeds.

### 9.3 Sanity ↔ Postgres link

The Sanity `school` document has a read-only `schoolId` string field filled from Postgres. GROQ fetches the Sanity school by `schoolId`; SQL fetches poll/bracket history by the same id. Outbound link URLs (official site, athletics schedule URL, roster URL) live on the Sanity school doc so editors can update them without a migration.
