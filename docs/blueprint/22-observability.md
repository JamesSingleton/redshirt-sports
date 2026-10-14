## 22. Observability

### 22.1 Sentry

- `@sentry/nextjs` in web, vote and admin (client, server, edge configs via `instrumentation.ts` and `instrumentation-client.ts`).
- Source maps uploaded in CI (Vercel integration or `withSentryConfig`), release = git SHA.
- Tags: `app`, `route`, `sport`, `division`, `poll_week_id`, `bracket_event`. User context = Clerk id only (no email).
- **Cron monitors** (Sentry Crons) for every scheduled job: `poll-tick` (open/close/tabulate/publish), `invite-expire`, `reminders`, `role-reconcile`, `newsletter-daily`. Missed or failed check-ins page someone.
- Alert rules: error rate spike on `/api/webhooks/*`; any `BRACKET_LOCKED` errors spiking right before lock (expected) vs after (bug); tabulation failure (critical).
- Sample rates: errors 100%, traces 5–10% normally, 100% on ballot/bracket actions (low volume, high value). Session replay only on the admin app and pick editor at low sample, with masking.

### 22.2 PostHog

- Product analytics through PostHog's **managed reverse proxy** on a first-party subdomain (e.g. `t.redshirtsports.com` CNAME, configured in PostHog + DNS) to reduce ad-blocker loss, **not** a Next.js rewrite; respect consent.
- Event naming `object_action` in `@rs/analytics/events.ts`: `article_viewed`, `paywall_shown`, `paywall_converted`, `newsletter_subscribed`, `ballot_saved`, `ballot_submitted`, `bracket_entry_created`, `bracket_pick_made`, `bracket_completed`, `group_created`, `group_joined`, `share_clicked`, `push_opted_in`.
- Funnels: bracket landing → sign-up → entry complete → group join; article → newsletter signup; metered wall → subscribe.
- Feature flags for staged rollouts (paywall, new bracket UI), experiments (headline tests on homepage modules only, not SEO titles).
- Web analytics dashboard for traffic by sport/division/team; group analytics by `school` to see which fan bases engage.
- Server-side capture for authoritative events (`ballot_submitted`, `bracket_completed`) from server actions.

### 22.3 Logs and metrics

- Structured JSON logs (pino) with request id; Vercel log drains to a log store (Axiom, Better Stack or Datadog) if needed.
- Supabase: enable `pg_stat_statements`, review slow queries weekly in season; use Supabase advisors (security and performance lints) in CI.
- Uptime checks on `/`, `/college-football/rankings/fcs`, `/api/health` (checks DB, Sanity reachability).
- Business dashboards: ballots submitted per week vs voters, bracket entries per hour near lock, newsletter growth.
