## 2. Reference sites: what each does well

The descriptions below are product-level observations. They describe features in general terms and avoid claims about traffic, revenue or audience size.

### 2.1 On3

| Area | What it does well | Lesson for Redshirt |
|---|---|---|
| Recruiting database | Deep player profiles for high school recruits with position, measurables, hometown, school, offers, visits, predictions and commitment history | Out of scope for Redshirt's database; cover recruiting editorially and link to official commitment announcements |
| Proprietary rankings and valuations | Its own player ranking and an industry composite-style ranking, plus a NIL valuation product | The credibility lesson applies to Redshirt's polls: a clear methodology page and visible history |
| Transfer portal tracker | Filterable list of portal entries by position, school, status, with commit updates | High-intent search topic; Redshirt covers it with tagged articles and roundups rather than a tracker database; v1.4 adds an article-driven hub; v1.5 adds the **Portal Tracker** at `/transfer-portal`, built from editor-maintained Sanity `portalEntry` docs, each citing a Redshirt story (§16.1) |
| Team sites network | Team-specific sub-brands with their own writers and premium boards | Team hubs should feel like a "site within the site": own feed, beat writers, poll history and curated outbound links |
| Premium model | Subscriptions that unlock premium intel and message boards, often per team site | Entitlements should be modelled so you can sell "all access" or "one team" later |

### 2.2 247Sports

| Area | What it does well | Lesson |
|---|---|---|
| Recruiting rankings and composite | Long-running player rankings, a composite ranking blending several services, and team class rankings with a points formula | Not built; the general lesson is derived rankings should be recomputable from raw inputs (applied to polls and brackets) |
| Crystal Ball-style predictions | Expert predictions of where a recruit will commit, with a track record | Engagement via predictions maps to the bracket challenge here |
| Team sites and boards | Team-focused communities with insider posts and forums | Community is sticky but expensive to moderate; defer forums until there is moderation tooling |
| Commitment and transfer feeds | Constant stream of short updates | Short-form "update" content type separate from long-form articles |

### 2.3 ESPN

| Area | What it does well | Lesson |
|---|---|---|
| Scores and gamecasts | Scoreboard by sport/division/week, game pages with box score, play-by-play, win probability | Redshirt does not build a scores product; hubs link to official scoreboards instead (§15) |
| Breadth and hubs | Consistent hub per sport, league, conference and team with news, schedule, roster, stats, standings | Every entity gets the same predictable tab structure (for Redshirt: news, rankings, brackets, staff, links) |
| Fantasy and games | Bracket Challenge, pick'em, fantasy with groups, leaderboards and national standings | The bracket UX bar is high: fast pick entry on mobile, clear lock times, group management, shareable brackets |
| Rankings pages | AP and coaches poll display with points, first-place votes, previous rank and others receiving votes | This is the exact display format the Redshirt poll pages should match or exceed |
| App and alerts | Favorite teams drive personalized feeds and push alerts | "Favorites" is a core user preference table |

### 2.4 Bleacher Report

| Area | What it does well | Lesson |
|---|---|---|
| Social-first storytelling | Visual, mobile-first, shareable cards and short takes | OG image generation and share cards matter as much as the article page |
| Team streams | Feed per team mixing original posts, highlights and links | A unified feed can mix articles, quick takes and video |
| Personalization | Follow teams and get a custom feed and alerts | Same follows model as ESPN (§31) |
| Rankings and listicles | Power rankings and list content | Listicle/ranked-list content type in Sanity |

### 2.5 The Athletic

| Area | What it does well | Lesson |
|---|---|---|
| Subscription and metering | Hard or metered paywall, premium long-form, ad-light experience | Build a metering service early, even if paywall stays off, so the switch is a config change |
| Beat writer depth | Team-focused coverage by local writers | People profiles with bylines, beats (writer to team) and "more from this writer" |
| Clean reading UX | Fast, readable, minimal clutter | Performance budgets and typography matter more than features |
| Newsletters | Many topic newsletters | Resend + audiences per team/division |

### 2.6 Sports Illustrated (SI)

| Area | What it does well | Lesson |
|---|---|---|
| Brand and long-form | Feature writing and photography | Strong image pipeline and large featured images |
| Team and school sub-sites | A network of team-focused sites under one domain | Team hubs with optional per-team editorial staff |
| Evergreen and SEO content | Explainers, rankings and history pieces | Evergreen content types and internal linking |

### 2.7 Synthesis

The common pattern across all six is **entity hubs** (sport, division, conference, team) that aggregate editorial content and structured data. Redshirt keeps the hubs and its own data (polls, brackets) and links out for scores, schedules and rosters. Redshirt's edge is not breadth; it is **depth on underserved levels** (FCS, D-II, D-III, and soon college basketball) plus **community trust features** (transparent voter ballots, open brackets).
