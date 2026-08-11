# Domain Glossary

## Redshirt Sports

College sports media site covering news, recruiting, and the transfer portal, with a weekly Top 25 poll as a distinctive product.

## Transfer Portal

Product surface for tracking college athlete transfers (wire / tracker), plus related editorial coverage.

Avoid: treating “transfer portal” as articles-only, or as a synonym for any roster change story.

## Recruiting

Product surface for tracking recruiting (wire / tracker), plus related editorial coverage. Peer vertical to Transfer Portal.

Avoid: treating “recruiting” as articles-only, or conflating it with Transfer Portal.

## School

A college or university. Canonical domain entity for institutions in content and app data. Sanity is the CMS source of truth; Postgres `schools` is the app read model (names + Sanity image asset refs) kept in sync for rankings and ballots. Rankings join live School display from Postgres — do not freeze logos/names into ranking rows.

## Team

Public-facing alias for a School’s athletics presence on the site (e.g. team hub). Not a separate entity from School.

Avoid: treating Team as a distinct per-sport entity, or using Team as the canonical name in domain language.

## Classification

Competition level under a Governing Body (e.g. NCAA Division I, NCAA Division II, NAIA). Parent level for Sport Subgroupings where those exist. Readers rarely navigate “Division I football” as a whole when FBS/FCS subgroupings apply.

## Sport Subgrouping

Reader-facing competitive bucket within a Classification and Sport — e.g. FBS and FCS in Division I football; Power Conferences and Mid-Major in Division I basketball. These are what people search and browse for, not the parent Classification alone. Editorial taxonomy (Sanity); not the same as a Poll.

Avoid: calling FBS/FCS/Power Conferences/Mid-Major a Classification; using “Division” as the canonical name for these buckets (legacy URL/UI only).

## Browse Scope

The high-level competitive slice a reader picks for a Sport’s news, rankings, or voting. For a given Sport, a Browse Scope is either a Sport Subgrouping (when the Classification is split for browsing — e.g. FBS, FCS, Power Conference, Mid-Major) or a Classification with no such split (e.g. Division II, Division III).

Examples: football Browse Scopes include FBS, FCS, Division II, Division III; men’s/women’s basketball Browse Scopes include Power Conference, Mid-Major, Division II, Division III.

Avoid: calling every Browse Scope a Division or a Sport Subgrouping; assuming Division I itself is a Browse Scope when subgroupings exist.

## Poll

First-class operational product in Postgres (`polls`): a Sport + Browse Scope (slug) that has voter assignments, Ballots, and published Rankings. Distinct from Sport Subgrouping / Browse Scope (editorial taxonomy). Seeded from `division_sports` today (e.g. football/fcs, mens-basketball/mid-major).

Avoid: treating a bare division string as the poll identity; authorizing any global voter for every poll URL.

## Ballot

A credentialed Voter’s ordered Top 25 of Schools for a Poll and Week. Stored as `ballots` (one row per submission) + `ballot_entries` (rank lines). The submitted artifact of the poll product. Historical ballots survive voter revoke.

## Vote

UI / route language for the act and place of submitting a Ballot (e.g. `/vote/`). Not a separate domain entity from Ballot — analogous to “go vote” vs “fill out your ballot.”

Avoid: modeling Vote as a distinct entity alongside Ballot; using Vote as the canonical name for the Top 25 submission.

## Voter

A credentialed User authorized to submit Ballots for specific Polls (`poll_voters`). Clerk `isVoter` is only the coarse gate to `/vote`; per-poll assignment is required to submit. Distinct from Author (editorial) and from a general signed-in User. Crossover across polls is allowed.

## Rankings

The published aggregate of Ballots for a Poll and Week (points, first-place votes, ties, others receiving votes). Stored as normalized `poll_rankings` rows (not jsonb blobs). Poll math (rank/points/FPVs/ties) is frozen at publish; School name/logo are live from `schools`.

Public JSON ingest for partners: [docs/rankings-api.md](docs/rankings-api.md).

Avoid: reintroducing `weekly_final_rankings` jsonb snapshots or `voter_ballot` / `weekly_team_rankings` as the read path.

## Top 25

The poll product name and ballot/cutoff size (ranks 1–25). Not a separate published artifact from Rankings. Teams with votes outside the Top 25 are Others Receiving Votes (ORV) on the same `poll_rankings` table.

Avoid: using Top 25 as the canonical name for the weekly published aggregate.

## Week

A voting and rankings period within a Season for a Sport and Year. FK to Postgres `weeks` (ESPN calendar: preseason / regular / postseason). URL specials `preseason` and `final-rankings` map in the app layer (legacy storage used `0` / `999` — do not store those integers on new tables). Ballots and Rankings are scoped to a Week.

See [docs/poll-weeks.md](docs/poll-weeks.md) for ESPN → `weekKey` → legacy URL mapping, voting-week lag (last completed week), Monday 8am MST publish cadence, and per-poll cutoffs (e.g. FCS playoffs).

## Season

The competition calendar for a Sport and Year, composed of Weeks (and season types such as preseason, regular, postseason).

## Conference

An athletic conference that sponsors one or more Sports and groups Schools for a given Sport. A School has at most one Conference affiliation per Sport.

Avoid: conflating Conference with a Voter’s media Organization.

## Article

A published piece of editorial content. Canonical domain term for what readers consume.

Avoid: using Post as the domain term (Post is the Sanity CMS document type name only).

## Story Type

Classification of an Article’s desk/intent: news, recruiting, transfer, analysis, opinion, game-recap. Does not replace Recruiting or Transfer Portal as product verticals.

## Author

An editorial person who writes Articles. Distinct from User and Voter.

## Organization

The media or institutional affiliation of a Voter (or User) — e.g. Sports Illustrated. Unrelated to athletic Conferences.

## Sport

A first-class competitive category that partitions news, Browse Scopes, Ballots, and Rankings — e.g. Football, Men’s Basketball, Women’s Basketball. Men’s and Women’s Basketball are distinct Sports.

## Governing Body

An organization that defines Classifications (e.g. NCAA, NAIA, NJCAA). Classifications sit under a Governing Body.

## User

A signed-in account holder. May be a Voter, an Admin, both, or neither. Distinct from Author.

## Division (legacy)

Historical / URL label often used where Browse Scope is meant. Not a canonical domain term going forward. Poll slugs may still match legacy URL segments (fcs, fbs, mid-major, …).

Avoid: using Division as the glossary name for FBS, FCS, Power Conference, Mid-Major, or the browse slot in general.

## Retired poll storage

Do not reintroduce `voter_ballot`, `weekly_final_rankings` (jsonb), or `weekly_team_rankings`. Drop them manually after cutover verify. New write/read path is `ballots` / `ballot_entries` / `poll_rankings`.
