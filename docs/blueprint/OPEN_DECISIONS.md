# Open decisions (handoff)

The full list is in [30-open-decisions-and-risks.md](30-open-decisions-and-risks.md). These are the ones that block or shape the work Cursor will do first. James confirmed the rows below on Oct 14, 2026.

| # | Decision | Status | What Cursor does until it's decided |
|---|---|---|---|
| **16** | **Must every Transfer Portal entry link a Redshirt story?** | **Decided: optional.** A missing story shows "No story yet". Studio warns, it does not block publish, and the public list does not hide the row | |
| **17** | **Transfer Portal Tracker UI** | **Decided: build the uploaded mockup now.** `docs/mockups/portal-tracker.html`, `portal-row-variants.html`, and `docs/mockups/src/app.css` (v1.7 `.portal-grid`) are the design | |
| 18 | **URLs match the blueprint.** Paths that already match (`/college/{sport}/news`, `/college/news`) stay. Everything else moves, with a legacy 301 in the same PR: rankings `7` / `0` / `final-rankings` → `week-7` / `preseason` / `final`; `news/{division}` → `{division}/news`; `/college/teams/{slug}` → `/teams/{school-nickname}` (Hollins keeps `hollins`); root `/[slug]` → `/college/{sport}/news/{slug}`; `/authors/{slug}` → `/people/{slug}`; `/vote/*` → `vote.` | **Decided: move them.** Each new route ships with its 301 | |
| 19 | Voting app | **Decided: `apps/vote` at `vote.redshirtsports.com`.** Voting only. No new voting surfaces on www. Legacy 301 from `/vote/*` when ballot editing moves | Build `apps/vote` in PR 2. Do not add voting pages to `apps/web` |
| /college | Standalone college page | **Decided: no page. `/college` returns 404.** It was never a live URL, so a 301 would not be a legacy redirect. `/college/news` and `/college/{sport}` stay | Do not add `app/college/page.tsx` |
| Slug lock | Published slug editing | **Decided: no lock,** after save or after publish. Do not set slug `readOnly` | |
| A1 | Sanity redirects | **Decided: permanent only.** Force `permanent: true` in `next.config.ts` and refuse a non-permanent `redirect` doc in Studio | Done in this PR |
| A2 | Slug changes | **Decided: keep `auto-redirect`; no slug lock.** A permanent 301 from the old slug URL to the new one is an explicit second exception to "only legacy 301s". Every other non-legacy redirect stays banned. `toPublicPath` keeps today's URLs until each #18 move | Do not retire the function |
| A3 | Onboarding | **Decided: `/onboarding` is for voters only.** Do not send a signed-in non-voter there. It later moves to `apps/vote` with voting | PR 4 |
| A4 | Voting location | **Decided by #19** | |
| A6 | `PROD_DATABASE_URL` | **Decided: documented and empty, for James only.** The local env guard refuses a non-empty value | |
| A7 | School sync | **Decided: call only an explicit `SCHOOL_SYNC_URL`, and mock locally.** James sets the URL in the deployed Function env. There is no production default | Done in this PR |
| A8 | Studio build | **Decided: agents run dev, lint, typecheck, and test only.** James runs every build and deploy (Studio schema, Functions, Vercel) | |
| A10 | Drizzle config path | **Decided: doc fix.** Config is `apps/web/drizzle.config.ts`. `CLAUDE.md` matches | Done in this PR |
| A11 | Upstash Redis locally | **Decided: local Redis stand-in** (`serverless-redis-http`), per [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) | |
| A12 | Naming | **Decided: `division` is canonical,** as in the blueprint. `CONTEXT.md` is revised. Browse Scope is retired. URL words like `fcs` stay | |
| A13 | Hollins slug | **Decided: `hollins` stays.** No nickname or mascot, so the `{school}-{nickname}` pattern does not apply | |
