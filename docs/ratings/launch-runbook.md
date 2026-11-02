# Launching FCS ratings & strength of schedule

How `feat/rating-pools` goes live. Migration `0024_rating_pools` creates the FCS pool **inactive and private**, so merging changes nothing the public can see. The cron does nothing until the backfill is done and you flip the switches.

## Before merging

1. **Add `CRON_SECRET` to the `redshirt-sports` (web) Vercel project**, Production, as a random 32+ character string (`openssl rand -hex 32`). Vercel Cron sends it as `Authorization: Bearer …`; without it, `/api/cron/ratings` refuses to run.
2. CI is green on the PR.

## Merge (Monday or Tuesday)

3. **Merge to `main`.**
   - Supabase applies `apps/web/supabase/migrations/0024_rating_pools.sql`: 7 new tables, the FCS pool row (inactive and private), and 137 ESPN team ids matched to Redshirt schools.
   - Vercel deploys web (with the 30-minute cron) and admin.
4. **Check the migration landed.** In the Supabase SQL editor:
   ```sql
   select slug, is_active, is_public from rating_pools;  -- fcs | f | f
   select count(*) from school_external_ids;              -- 137
   ```

## Backfill production (about 3 minutes, from your machine)

Each season's starting point is the previous season's final ratings, so go oldest to newest. Point the CLI at production for these commands only. `--allow-remote` is required on purpose.

```bash
export DATABASE_URL="<production connection string>"
for y in 2022 2023 2024 2025; do
  pnpm ratings sync --season $y --allow-remote
  pnpm ratings publish --season $y --allow-remote
done
pnpm ratings sync --season 2026 --allow-remote
pnpm ratings publish --season 2026 --allow-remote   # only weeks already played
unset DATABASE_URL
```

`publish` without `--week` skips any week still to be played; the cron owns the week in progress. If a sync reports "Blocking publish: … isn't mapped", map that team (step 5) and rerun that season.

## Turn it on (admin → Ratings & SOS)

5. **Team mapping → Check 2026 members.** It should say every member is mapped.
6. **Runs:** confirm 2026 Week 9 is published and preview it.
7. Flip **"Cron syncs and publishes this pool"** on.
8. Flip **"Ratings pages are public"** on. This expires the web cache, so the pages appear immediately. Until then, and before the migration lands, the ratings pages and `/ratings/methodology` return 404, and builds treat the missing tables as "nothing published yet". That's why Vercel can build before Supabase finishes the migration.
9. Open https://www.redshirtsports.xyz/college/football/ratings/fcs and spot-check a team sheet, `/ratings/methodology`, and the accuracy page.
10. Add **Ratings** to the Sanity navbar document (Football → FCS), linking `/college/football/ratings/fcs`.

## After launch

- **Saturday 16:00 UTC through Sunday noon UTC**, every 30 minutes: the cron syncs this week and publishes once every game is final, usually early Sunday. If ESPN corrects a score before noon, it republishes.
- **Sunday noon UTC (6:00 AM CST):** the window closes and the week is frozen. Voters work from it all Sunday, and it doesn't move before ballots are due Monday at 9:00 AM CST. If a stuck ESPN game holds up the publish, it shows in Sentry and the Job log; publish that week from admin. To fix something later, recompute and publish it from admin (the Runs table shows the before/after diff first).
- A rare Monday game counts in the next weekend's ratings.
- Every run is in admin → Ratings → Job log. Failures and blocked publishes go to Sentry.
- To pause: switch the cron off. To pull the pages: switch Public off. To undo a bad week: publish an older run from the Runs table.
