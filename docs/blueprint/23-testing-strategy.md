## 23. Testing strategy

| Layer | Tool | What |
|---|---|---|
| Pure engines | Vitest | `@rs/polls` tabulation (ties, cutoff ties, movement, dropped), `@rs/brackets` formats (game counts, every slot used once, every game reachable, byes), resolve/validate/cascade, scoring maxima (720/800/640/760), tiebreak order |
| Property tests | fast-check | Random ballots: TS tabulation == SQL tabulation; random picks: score ≤ max_possible, monotonic as results arrive |
| SQL | pgTAP via `supabase test db` | RLS visibility matrix (anon, user A, user B, voter, admin), lock enforcement (submit after close → error), uniqueness, triggers, tabulation function golden tests |
| Integration | Vitest + local Supabase + Drizzle | Server actions with mocked Clerk `auth()`; webhook handlers with signed fixtures (svix, Sanity); `withRls` visibility; transaction-per-test with rollback |
| Invites | Vitest | Token tampering, expiry, reuse (second accept fails), revoked invite, resend invalidates the old link, email mismatch vs `allow_any_email`, concurrent double-accept, role sync and reconcile |
| Migrations | drizzle-kit `check` + drift check in CI | Schema and generated SQL never diverge |
| Components | Testing Library + happy-dom | PollTable, BracketGrid keyboard nav, ballot editor reorder |
| E2E | Playwright | Voter submits ballot; window closes; results publish; reader fills FCS bracket, creates group, friend joins with code; lock prevents edits; scores update leaderboard |
| Visual | Playwright screenshots (or Chromatic) | Bracket rendering for each format at mobile/desktop |
| Accessibility | axe-core in Playwright | Every key template; zero serious/critical violations |
| Performance | Lighthouse CI on preview deploys | Budgets in §26 |
| Load | k6 | Bracket lock surge (many saves in the last hour), leaderboard reads after a final, poll publish spike |
| Time travel | Fake timers + a `now()` override in SQL tests (`set local app.now = ...` read by a `app.now()` helper used instead of `now()` in lock checks) | Lock and window logic around boundaries |

**Golden fixtures**: store historical real brackets and ballots (anonymized) in `packages/testing/fixtures` and assert the engine reproduces published results exactly.
