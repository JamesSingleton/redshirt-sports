## 3. Feature map

Priority: **P0** = MVP, **P1** = season one, **P2** = later, **P3** = maybe. **Out** = deliberately not built (link out instead).

| Module | Inspired by | Features | Priority | Owner system |
|---|---|---|---|---|
| News | All | Articles at `/{sport}/news/{slug}`, categories, tags, bylines (people), related content, breaking banner, `?page=n` archives | P0 | Sanity |
| People profiles | The Athletic, SI | One `person` per human (writers, editors, photographers, hosts, staff, voters), `/people/{slug}`, masthead | P0 | Sanity |
| One-off pages | All | About, Contact, Privacy, Terms, Ethics/Corrections, Advertise, Careers via a section-based page builder at the site root | P0 | Sanity |
| Team hubs | ESPN, SI, On3 | News, poll history, bracket appearances, beat writers, **outbound links** (official schedule, roster, stats, tickets) | P0 | Sanity + Supabase |
| Conference hubs | ESPN | News, members, poll snapshots, outbound links (standings, schedule on the conference site) | P0 | Sanity + Supabase |
| Top 25 polls | AP/ESPN display | Invite-only voters, ballots, automated windows, tabulation, transparency, history | P0 | Supabase |
| Voter app | — | `vote.redshirtsports.com`: invites, ballots, history | P0 | Supabase + Clerk |
| Bracket Challenge | ESPN | One event per division per season; groups, leaderboards; **manual results** | P0 (FCS), P1 (FBS/CFP, D-II, D-III), P2 (NCAAB) | Supabase |
| Podcasts and video | ESPN, SI | Episode pages, embeds, transcripts | P1 | Sanity (+ YouTube/Mux) |
| Follows + For you feed | ESPN, B/R | Follow teams/conferences/divisions/writers, onboarding picker, personalized home (§31) | P0 | Supabase + Sanity |
| Newsletters | The Athletic | Daily, Poll Release, My Teams, Bracket (§31.4) | P0 (Poll Release), P1 (rest) | Resend + Supabase |
| Reader engagement | ESPN, B/R | Saved articles, poll share cards, Notify me on polls (§31); no fan vote | P1 | Supabase |
| Ads and sponsorships | All | Display ads, sponsored polls/brackets | P1 | Ad network + Sanity |
| Push and alerts | ESPN, B/R | Poll released, bracket lock reminders, followed-team news | P1 | Supabase + web push |
| Subscriptions | The Athletic, On3 | Metering, paywall | P2 | Clerk Billing or Stripe |
| Community | 247, On3 | Comments, boards: not in 2026–27 (§31.9) | P3 | Third party |
| Scores, schedules, standings, game pages | ESPN | — | **Out** (link out) | — |
| Live scoring, live blogs | ESPN, The Athletic | — | **Out** | — |
| Rosters, player profiles | ESPN, On3, 247 | — | **Out** (link out) | — |
| Transfer Portal + Recruiting hubs (article-driven) | On3, 247 | Storylines, commit coverage cards, Portal Tracker from Sanity `portalEntry` (§16) | P1 | Sanity |
| Recruiting DB, portal database, pick'em, predictions | On3, 247, ESPN | — | **Out** | — |
