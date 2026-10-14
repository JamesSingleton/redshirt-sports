# Mockups (blueprint v1.7)

Paths in the banners and links follow the v1.6 level → sport structure (`/college/football/…`). Static HTML mockups built with the blueprint's Tailwind v4 tokens and shadcn markup. **All data is fake** (Example Player A…, Example Voter 01–22, Example Team A–G, example outlets); poll pages share one seeded 22-voter example poll (`gen/polldata.py`). Open any `.html` file directly in a browser; they only need `css/app.css` and `fonts/`.

| File | Screen | Screenshots (`screenshots/`) |
|---|---|---|
| `college.html` | Visual reference only. **`/college` is a 404**, not a page to build | `college-desktop.png`, `college-desktop-full.png`, `college-mobile.png` |
| `index.html` | Home | `home-desktop.png`, `home-desktop-full.png`, `home-mobile.png`, `home-desktop-dark.png`, `nav-mega-desktop.png`, `nav-sheet-mobile.png` |
| `article.html` | Article | `article-*` |
| `news.html`, `division-news.html` | News index, division news (`?page=n`) | `news-*`, `division-news-*` |
| `rankings.html` | Rankings, Poll tab `/college/football/rankings/fcs` (v1.7): "On X of 22 ballots", "See all 22 ballots" CTA, Others receiving votes / Dropped out / No longer receiving votes | `rankings-*` |
| `ballots.html` | Ballot breakdown, **all ballots, unfiltered** (v1.7): all 22 voter columns, sticky header + team column, outliers | `ballots-*`, `ballots-desktop-dark.png` |
| `ballots-by-voter.html` | **Ballots by voter** (v1.7) `…/ballots/by-voter`: voter list, full-ballot cards with diff vs consensus, search, sort | `ballots-by-voter-*` |
| `rankings-voters.html` | **Voters tab** (v1.7) `…/rankings/fcs/voters`: roster, outlets, disclosures, ballot + profile links | `rankings-voters-*` |
| `rankings-history.html` | **History tab** (v1.7) `…/rankings/fcs/history`: rank chart, week-by-week table, No. 1 history | `rankings-history-*` |
| `rankings-methodology.html` | **Methodology** (v1.7) `…/rankings/methodology`: points, FPV, eligibility, window automation, transparency, outliers, FAQ | `rankings-methodology-*` |
| `ballot.html` | Voter ballot editor (vote.) | `ballot-vote-*` |
| `bracket.html`, `bracket-picks.html` | Bracket view, pick editor | `bracket-*`, `bracket-picks-*` |
| `team.html` | Team hub sport section | `team-hub-*` |
| `transfer-portal.html`, `recruiting.html` | Portal / recruiting hubs | `transfer-portal-*`, `recruiting-*` |
| `portal-tracker.html` | **Transfer Portal Tracker** (Decision #17: this is the design to build) | `portal-tracker-*` |
| `portal-row-variants.html` | Tracker row variants (phone, tablet, desktop) | `portal-row-variants-*`, `portal-hub-*` |

- `src/app.css`: source tokens plus the v1.7 `.portal-grid` (header and rows share one grid; container queries). `css/app.css` is the compiled output.
- Rebuild (optional): `npm i && python3 gen/build.py && npx @tailwindcss/cli -i src/app.css -o css/app.css && python3 shoot.py` (Python 3 + Playwright with Chrome). Don't commit `node_modules`.
- Desktop shots are 1440×900 @1x; mobile shots are 390×844 @2x.
- Third-party reference screenshots (On3, MarchArena) are intentionally not included.
