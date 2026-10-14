## 4. Architecture overview

```mermaid
flowchart LR
  subgraph Clients
    B[Readers / PWA]
    V[Invited voters]
    ST[Staff]
    E[Editors]
  end
  subgraph Vercel
    W["apps/web<br/>www.redshirtsports.com"]
    VO["apps/vote<br/>vote.redshirtsports.com"]
    A["apps/admin<br/>admin.redshirtsports.com"]
    S["apps/studio<br/>studio.redshirtsports.com"]
    CR[Vercel Cron]
  end
  subgraph Sanity
    CL[Content Lake]
    CDN[Sanity CDN + Image API]
  end
  subgraph Supabase
    PG[(Postgres via Supavisor)]
    STG[Storage]
  end
  CK[Clerk<br/>shared session *.redshirtsports.com]
  RS[Resend]
  SE[Sentry]
  PH[PostHog]
  EXT[External sources<br/>school sites, NCAA.com]

  B --> W
  V --> VO
  ST --> A
  E --> S
  S --> CL
  W -->|GROQ| CDN
  W -->|Drizzle| PG
  VO -->|Drizzle| PG
  A -->|Drizzle| PG
  VO --> STG
  W & VO & A --> CK
  CK -->|webhooks| W
  CL -->|webhooks| W
  CR -->|poll tick, reminders| A
  A -->|revalidate tags| W
  W -. outbound links .-> EXT
  W & VO & A --> RS
  W & VO & A --> SE
  W --> PH
```

**Key principles**

1. **Server-first reads.** Public pages read Sanity and Postgres on the server and cache aggressively with tags. The browser does not query Supabase in the MVP (Storage uploads use signed URLs).
2. **One write path per domain.** Ballots are written only through `submitBallot()`; picks only through `saveBracketEntry()`; results only through `setBracketGameResult()`. All are Drizzle transactions in `packages/db` that take row locks and enforce lock times, called from server actions that validate with zod.
3. **Postgres enforces invariants.** One ballot per voter per poll week, one bracket event per sport/division/season, one entry per user per group, rank uniqueness: constraints, not just app checks.
4. **Derived data is recomputable.** Poll results, bracket scores and leaderboards can be rebuilt from ballots, picks and admin-entered results at any time. Audits and corrections are safe.
5. **Content and data join by canonical IDs.** Sanity `school` documents carry the canonical `schoolId` used in Postgres, so a team hub joins both worlds without fuzzy matching.
6. **Own what's unique, link to what's commodity.** Redshirt owns polls, brackets and journalism; schedules, scores and rosters are links.
