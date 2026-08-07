# Release smoke checklist — apps/web

Run against **staging** after deploy (~20 min). This is the primary guard for real auth, env, and DB integration while Playwright E2E is deferred.

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
