## 30. Open decisions and risks

| # | Decision / risk | Options | Recommendation |
|---|---|---|---|
| 1 | Writes via user-scoped client (RLS) vs server DB | RLS-first vs server-first | Server-first writes via `adminDb` + zod + role checks; RLS for optional browser reads |
| 2 | ORM | **Decided: Drizzle** | Schema, policies, migrations, queries |
| 3 | Incomplete brackets at lock | Score as-is vs exclude | Score as-is; label "Incomplete" |
| 4 | Poll ties at No. 25 | Include all tied vs tiebreak to 25 | Include all tied (T-25) and document it |
| 5 | Paywall timing | Metering on vs off at launch | Build in Phase 3, launch with `mode=off` |
| 6 | Sports data product | Link-out (current) vs build later | **Decided: link-out.** Revisit only as a new major version |
| 7 | Community (comments/forums) | Build vs third-party vs none | None until moderation capacity exists |
| 8 | Prizes for bracket challenge | None vs sweepstakes | None without legal review |
| 9 | Sanity document quota | Growth add-on vs Enterprise | Measure after import |
| 10 | Risk: lock-time surge | | Load test; static shell; queue scoring after result entry |
| 11 | Risk: poll credibility challenges | | Transparency, CSV + hash, methodology, disclosures |
| 12 | Risk: URL change hurts search | | Complete redirect map, Search Console, keep redirects permanently |
| 13 | Risk: staff miss a result entry | | Admin checklist + Slack/email reminder when a `starts_at` has passed with `status=pending` |
| 14 | Risk: Clerk subdomain cookie issues in local/preview | | Document Allowed Subdomains; use shared preview hostnames or accept re-login across ports |
| 15 | Image delivery | `sanity-image` vs next-sanity loader | **Decided: `sanity-image`**; next-sanity loader is the documented alternative (§26) |
| 16 | **Portal tracker: must every entry link a Redshirt story?** | (a) required; (b) optional, "No story yet"; (c) hidden until a story exists | **Decided: (b).** Studio warning, public row stays, "No story yet" when empty |
| 17 | **Portal tracker UI** | Redesign before build vs the uploaded mockup | **Decided: build the uploaded tracker UI now** (`docs/mockups/portal-tracker.html`, v1.7 `.portal-grid`) |
| 18 | Residual URL moves | Rankings week segment, division news order, team hubs, root articles, author pages, `/vote/*` | **Decided: move to the blueprint URLs.** Each moved route ships with its legacy 301 in the same PR. Paths that already match stay |
| 19 | Voting location | `apps/web` `/vote` vs `apps/vote` on `vote.redshirtsports.com` | **Decided: `apps/vote` at `vote.redshirtsports.com`.** Legacy 301 from `/vote/*` when ballot editing moves |
| A2 | Slug changes | Lock after publish vs keep `auto-redirect` | **Decided: keep `auto-redirect`. No slug lock.** Automatic permanent slug-change 301s are allowed. Every other non-legacy redirect stays banned |
| A12 | Naming | Browse Scope vs `division` | **Decided: `division` is canonical.** Browse Scope is retired. `CONTEXT.md` is revised |
| /college | Level hub page | Build a hub vs 404 | **Decided: `/college` returns 404.** It was never a live URL |
