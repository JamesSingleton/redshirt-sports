# Phase 1 mockups (no-accounts build)

These are the same static mockups as `../`, but built with `RS_PHASE1=1`. That build removes everything Phase 1 doesn't ship:
- sign-in, Follow teams, Following badges, "Your teams"
- Notify me, poll-release alerts
- saved/bookmark buttons, "For you", the follow prompt
- the newsletter card
- the ticker and the mobile bottom nav

The header and footer use the **real Redshirt Sports logos** from Sanity Global Settings: `settings.footerLogo` for the light header, and `settings.footerLogoDarkMode` for the dark header and the footer. Local copies are in `../brand/` for the static HTML only. All data is fake.

| File | Page (route) | Screenshots (`screenshots/`) |
|---|---|---|
| `index.html` | Home `/` | `home-{desktop,tablet,mobile}`, `nav-mega-desktop`, `nav-sheet-mobile` |
| `article.html` | Article | `article-*` |
| `news.html`, `division-news.html` | News indexes | `news-*`, `division-news-*` |
| `team.html` | Team page | `team-hub-*` |
| `rankings.html` | Poll tab (existing week URL) | `rankings-*`, `rankings-desktop-dark` |
| `ballots.html` | `…/[week]/ballots` | `ballots-*`, `ballots-desktop-dark` |
| `ballots-by-voter.html` | `…/ballots/by-voter` | `ballots-by-voter-*` |
| `rankings-voters.html` | `…/[division]/voters` | `rankings-voters-*` |
| `rankings-history.html` | `…/[division]/history` | `rankings-history-*` |
| `rankings-methodology.html` | `…/rankings/methodology` | `rankings-methodology-*` |
| `rankings-index.html` | `/college/[sport]/rankings` (new) | `rankings-index-*` |

- Screenshot sizes: desktop 1440×900 @1x, tablet 820×1180 @2x, mobile 390×844 @2x.
- Ribbon URLs use `week-7` for illustration only. The repo uses `7`, `preseason` and `final-rankings`.
- To rebuild: `RS_PHASE1=1 python3 gen/build.py && npx @tailwindcss/cli -i src/app.css -o css/app.css && python3 shoot_phase1.py` (rename `dist/` to `css/` in the script if you run it from this copy).

## Update 2026-10-19
- New `teams.html` → `/college/teams` (inclusion rule: school has ever been ranked in our FBS or FCS Top 25 (app database) OR is mentioned in a published article (Sanity); mockup data covers the Sanity half only, see the HTML comment). No article counts on cards. Shots: `teams-{desktop,tablet,mobile}[-full]`.
- Nav logic fixed: each sport trigger opens its own panel (`?mega-fb`, `?mega-mbb`, `?mega-wbb`; `?mega-open` = football). Mobile/tablet sheet is an accordion per sport. Bracket Challenge, follow and sign-in removed from Phase 1. Shots: `nav-open-{desktop,desktop-mbb,tablet,mobile}`, `nav-mega-desktop`, `nav-sheet-mobile` (regenerated). Script: `../shoot_nav_teams.py`.

## Update 2026-10-19 (round 3)
| File | Route | Screenshots |
|---|---|---|
| `news.html` | `/college/[sport]/news` (archive redesign) | `news-*` |
| `division-news.html` | `/college/[sport]/news/[division]` (conference combobox; `?combo-open`) | `division-news-*`, `division-news-combobox-{desktop,mobile}` |
| `conference-news.html` | `/college/[sport]/news/[division]/[conference]` (new) | `conference-news-*` |
| `team.html` | team page, single page with anchor sections | `team-hub-*` |
| `teams.html` | `/college/teams` | `teams-*` |
| `news-loading.html`, `rankings-loading.html` | `loading.tsx` references | `news-loading-*`, `rankings-loading-*` |
- Most read (past 24h) appears on home, news, division/conference news, article and team.
- Conference names: Sanity (read-only). Team route (decided): `/college/teams/[slug]`.
- Rebuild: `RS_PHASE1=1 python3 gen/build.py && npx @tailwindcss/cli -i src/app.css -o dist/app.css && python3 shoot_phase1.py && python3 shoot_round3.py && python3 shoot_nav_teams.py`.
