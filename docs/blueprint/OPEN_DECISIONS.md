# Open decisions (handoff)

The full list is in [30-open-decisions-and-risks.md](30-open-decisions-and-risks.md). These are the ones that block or shape the work Cursor will do first.

| # | Decision | Status | What Cursor does until it's decided |
|---|---|---|---|
| **16** | **Must every Transfer Portal entry link a Redshirt story?** | **Decided: (b) optional.** James is doing the portal work. A missing story shows "No story yet" (v1.7 mockups). Studio warns, it does not block publish, and the public list does not hide the row |
| **17** | **Transfer Portal Tracker UI** | **Decided: build the uploaded mockup now.** `docs/mockups/portal-tracker.html` and `portal-tracker-*.png` are the design. The "redesign before build" hold is over |
| 18 | **URLs match the blueprint.** Paths that already match (`/college/{sport}/news`, `/college/news`, sport hubs) stay. Everything else moves, with a legacy 301 in the same PR: rankings week segment to `week-7` / `preseason` / `final`; `news/{division}` → `{division}/news`; `/college/teams/{slug}` → `/teams/{school-nickname}` (a school with no nickname, such as Hollins, keeps a single-token slug); root `/[slug]` → `/college/{sport}/news/{slug}`; `/authors/{slug}` → `/people/{slug}`. Add `/college` (new, no redirect) | **Decided** | Move what does not match. Do not invent a second URL scheme |
| 19 | Voting app | **Decided: `apps/vote` at `vote.redshirtsports.com`,** as the blueprint originally specified. Voting only. No new voting surfaces on www. Legacy 301 from `/vote/*` when ballot editing moves | Build `apps/vote`. Do not add voting pages to `apps/web` |
| A1 | Sanity redirects | **Decided: permanent only.** Force `permanent: true` in `next.config.ts` and refuse a non-permanent `redirect` doc in Studio | |
| A2 | Published slugs | **Decided: read-only after first publish.** Headline, body, and media can still change. A new URL is a manual legacy 301, not `auto-redirect`. Retire that function after slugs are locked | |
| A3 | Onboarding | **Decided: `/onboarding` is for voters only.** Do not send a signed-in non-voter there | |
| A7 | School sync | **Decided: mock it locally.** The Sanity function logs and does not call production. Local Postgres schools come from the example seed until a real sync is asked for | |
| A12 | Naming | **Decided: fresh language.** New schema, types, and copy use the glossary (Browse Scope, not Division). This is not a delete-and-rebuild of the live site | |
| A13 | Hollins slug | **Decided: `hollins` stays.** No nickname or mascot, so the `{school}-{nickname}` pattern does not apply |
