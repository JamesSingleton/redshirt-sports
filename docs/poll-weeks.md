# ESPN weeks → Top 25 poll weeks

How college football (and other sports) calendar weeks from ESPN become ballot and rankings weeks in Redshirt Sports.

## Layers

| Layer | Identity | Example |
| --- | --- | --- |
| ESPN / Postgres `weeks` | `(seasonType, weekNumber)` | Regular Week 5 → type `2`, number `5` |
| Calendar key (admin) | `weekKey` = `{seasonType}-{weekNumber}` | `2-5`, `1-1`, `3-1` |
| Legacy edge (URLs / older APIs) | Integer | `0` preseason, `N` regular, `999` final rankings |
| Storage | `weeks.id` UUID | Ballots and `poll_rankings` FK this — never store `0`/`999` on new tables |

## ESPN season types → poll outcome

| ESPN | Stored | `weekKey` | Legacy / URL | Top 25 meaning |
| --- | --- | --- | --- | --- |
| Type **1** Preseason (single week, often text `"Week 1"`) | seasonType=1, number=1 | `1-1` | `0` / `preseason` | **Preseason** Top 25 |
| Type **2** Regular Week N | seasonType=2, number=N | `2-N` | `N` / `/N` | Regular **Week N** |
| Type **3** Postseason week 1 (text usually `"Bowls"`) | seasonType=3, number=1 | `3-1` | `999` / `final-rankings` | **Final Rankings** |
| Type **4** Off Season (`"All-Star"`) | stored, not publishable | — | — | No Top 25 |

There is **no ESPN “Week 0” row**. Colloquial Week 0 games fall inside Regular Season **Week 1**’s date window. Legacy `0` means Preseason only.

**Product (football):** no Week 0 Top 25. Voting stays on Preseason until Regular Week 1’s ESPN `endDate` minus 48 hours.

For **2026 football**, ESPN Preseason ends `2026-08-22T06:59:00.000+00:00` (regular season / Week 1 starts immediately after). Dates always come from live ESPN / synced `weeks` rows — not hardcoded in app logic.

### Regular season length vs Bowls

ESPN does **not** end regular season at Week 13. Late weeks (conference championships, etc.) stay type **2** as Week 14+. Bowls/playoffs are type **3** (`"Bowls"` → Final Rankings).

Example from ESPN calendar data:

- **2025 football:** Regular Weeks 1–16, then `"Bowls"`
- **2026 football:** Regular Weeks 1–15, then `"Bowls"`

Default: allow ballots/publish for every regular week through the last type-2 week, then one Final Rankings on `"Bowls"` — unless a poll-specific cutoff applies (below).

## Voting week (ballot attachment)

Live ESPN date windows drive which week is “in progress” on the calendar. **Ballots do not use that.**

**Voting week** = last ESPN **regular** week eligible for voting at `endDate - 48h`, else Preseason, else Final Rankings after regular season ends.

Voters may submit while Sunday/Monday games are still unfinished; those ballots stay attached (one-shot, no edit).

```text
if no regular week has (endDate - 48h) <= now:
  → Preseason (legacy 0 / weekKey 1-1)
else:
  → max(week.number) among regular weeks where now >= week.endDate - 48h
after regular.endDate:
  → Final Rankings (legacy 999 / weekKey 3-1)
```

Effects:

- Through Week 0 / mid Week 1 (more than 48h before Week 1 `endDate`) → Preseason ballots
- From Week N `endDate - 48h` until Week N+1 `endDate - 48h` → Week N ballots (including after the real `endDate`)
- Monday **8:00 AM America/Denver** is the operational nudge/publish deadline — not the week-flip clock

Admin publish desk selects weeks by `weekKey`. Public rankings URLs still use legacy segments (`0`, `N`, `final-rankings`).

## Per-poll cutoffs (manual)

ESPN weeks are **sport-level** (one football calendar). Divisions do not get separate week rows.

Example: **FCS 2026** playoffs start ~Nov 28, 2026 (championship ~Jan 4, 2027). We do **not** run FCS Top 25 during the playoffs. That cutoff is mid/late ESPN regular season — not encoded in ESPN data.

Operational model:

1. Voting week still resolves from the shared sport calendar.
2. **Admin** chooses whether to nudge/publish for a given poll+week (skip FCS once playoffs start; Final Rankings only if desired).
3. There is no poll-level `lastRegularWeek` / playoff-start config yet. Use selective publish and ballot week reassignment for edge cases.

## Related code

- Mapping: `packages/db/src/utils/week-mapping.ts`, `packages/clients/src/espn/week-url.ts`
- Voting week: `getVotingWeek` / `getSeasonInfo().votingWeek` in `packages/clients/src/espn/api.ts`
- Public rankings API week segments: [rankings-api.md](./rankings-api.md)
- Domain glossary: [CONTEXT.md](../CONTEXT.md) (Week)
