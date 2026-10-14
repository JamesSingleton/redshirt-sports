# Open decisions (handoff)

The full list is in [30-open-decisions-and-risks.md](30-open-decisions-and-risks.md). These are the ones that block or shape the work Cursor will do first.

| # | Decision | Status | What Cursor does until it's decided |
|---|---|---|---|
| **16** | **Must every Transfer Portal entry link a Redshirt story?** James notes not every player has a story. Options: (a) required, as in v1.5; (b) optional, with no Story link when empty; (c) optional, but hidden from the public list until a story exists | **Under review** | Build (b): `story` is optional with a Studio *warning*; the GROQ doesn't filter on story; the row hides the Story link. Switching to (a) or (c) is a small change (restore `r.required()` / add the filter back) |
| **17** | **Transfer Portal Tracker UI redesign** | **Open: redesign before build** | Build the schema, GROQ, zod params, canonical/noindex, the cached data function and the route with a plain list. Don't build `PortalRow`, filters or summary cards from the v1.5 mockups |
| 18 | URL migration from `/college/{sport}/…`, `/college/teams/{slug}` and root `/[slug]` to the §17 map | Open | Don't move any URL until the decision is made. When moving: new route → verify → legacy 301, all in one PR |
| 19 | Voting on `vote.redshirtsports.com` (`apps/vote`) vs. the current `/vote` in `apps/web` | Target `vote.`, timing open | No new voting surfaces on www. Bug fixes in `/vote` are fine |
| A1–A3 | Non-permanent Sanity redirects; slug-change auto-redirects; onboarding redirect in `proxy.ts` | Decide in Milestone 0 | Leave as is; don't extend them |
