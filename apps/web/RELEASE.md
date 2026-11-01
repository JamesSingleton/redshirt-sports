# Releasing apps/web

## How changes go live

`main` is the only long-lived branch. Merging to `main` builds a **staged** production deployment: it uses production env vars and data, but the live domains stay on the current deployment until it is promoted.

Promotion happens through the [Promote production](../../.github/workflows/promote-production.yml) workflow:

- **Daily at 10:00 UTC** it promotes the newest ready staged build, if it is newer than live and its commit passed CI (`Lint and Test`).
- **On demand**: Actions → Promote production → Run workflow. Leave the input empty for the newest staged build, or paste a deployment ID/URL.

Why batch: each live deploy starts with an empty ISR cache that crawlers refill, so every promotion costs ISR writes. Merge as often as you like; promote when a batch is ready.

**Hotfix**: merge to `main`, wait for the build and CI, then run the workflow manually.

**Rollback**: Vercel dashboard → Deployments → previous deployment → Instant Rollback (or run the workflow with that deployment's ID). Then set the repo variable `PROMOTE_PAUSED=true` so the daily run doesn't re-promote the bad build. Delete the variable once a fixed build is on `main`.

Staged builds talk to production Postgres, Clerk, and Sanity. Anything you submit while testing one (ballots, onboarding) writes real data.

### One-time setup

1. Vercel → redshirt-sports → Settings → Environments → Production: turn off **Auto-assign Custom Production Domains**.
2. GitHub repo secret `VERCEL_TOKEN`: a Vercel access token scoped to the team.
3. GitHub repo variables `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (values in `apps/web/.vercel/project.json`).

## Smoke checklist

Run against the **staged deployment URL** before promoting (~20 min). This is the primary guard for real auth, env, and DB integration while Playwright E2E is deferred.

## Voting

1. **Voter assignment** — Admin assigns voter to FBS poll; voter can access `/vote/college/football/fbs`
2. **Non-assigned voter** — Signed-in user without poll assignment is redirected home from vote page
3. **Voter revoke** — Remove `isVoter` in Clerk; voter loses access; historical ballot still visible in admin
4. **Ballot submit** — Full 25-team ballot; confirmation page; cannot re-vote same week (409 in network tab)
5. **Previous ballot** — "Use Previous Ballot" populates form correctly

## Rankings

6. **Rankings publish** — Cron or admin publish; public rankings page shows correct points, ties, ORV, movement arrows
7. **Rankings filters** — Year/week dropdowns navigate; `preseason` and `final-rankings` URLs work
8. **School sync** — Sanity school update triggers webhook; rankings page shows updated school name/logo
9. **Sitemap** — `/college/football/rankings/sitemap/0.xml` includes `preseason` and `final-rankings` URLs

## Auth / content

10. **Onboarding gate** — Incomplete onboarding redirects to `/onboarding` from protected routes
11. **Draft mode** — Enable draft in Sanity; article page renders with draft perspective inside Suspense shell
