# Mockups (blueprint v1.5)

Static HTML mockups built with the blueprint's Tailwind v4 tokens and shadcn markup. **All data is fake** (Example Player A…, Example State…). Open any `.html` file directly in a browser; they only need `css/app.css` and `fonts/`.

| File | Screen | Screenshots (`screenshots/`) |
|---|---|---|
| `index.html` | Home | `home-desktop.png`, `home-desktop-full.png`, `home-mobile.png`, `home-desktop-dark.png`, `nav-mega-desktop.png`, `nav-sheet-mobile.png` |
| `article.html` | Article | `article-*` |
| `news.html`, `division-news.html` | News index, division news (`?page=n`) | `news-*`, `division-news-*` |
| `rankings.html` | Rankings (no fan vote) | `rankings-*` |
| `ballots.html` | Voter ballot breakdown | `ballots-*`, `ballots-desktop-dark.png` |
| `ballot.html` | Voter ballot editor (vote.) | `ballot-vote-*` |
| `bracket.html`, `bracket-picks.html` | Bracket view, pick editor | `bracket-*`, `bracket-picks-*` |
| `team.html` | Team hub sport section | `team-hub-*` |
| `transfer-portal.html`, `recruiting.html` | Portal / recruiting hubs | `transfer-portal-*`, `recruiting-*` |
| `portal-tracker.html` | **Transfer Portal Tracker: UI redesign pending (Open Decision #17). Layout/data reference only; don't build from it** | `portal-tracker-*` |

- `src/app.css`: source tokens + `@utility portal-row` (named `grid-template-areas`). `css/app.css` is the compiled output.
- Rebuild (optional): `npm i && python3 gen/build.py && npx @tailwindcss/cli -i src/app.css -o css/app.css && python3 shoot.py` (Python 3 + Playwright with Chrome). Don't commit `node_modules`.
- Desktop shots are 1440×900 @1x; mobile shots are 390×844 @2x.
- Third-party reference screenshots (On3, MarchArena) are intentionally not included.
