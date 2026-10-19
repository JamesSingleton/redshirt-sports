## Appendix B: Environment variables

| Variable | Apps | Secret |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` | web, vote, admin | secret yes (except publishable) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | web, vote, admin | No |
| `SUPABASE_SECRET_KEY` | web/vote/admin (server) | Yes |
| `DATABASE_URL` (Supavisor transaction, 6543, `rs_server`, `?pgbouncer=true`) | web, vote, admin | Yes |
| `DATABASE_URL_SESSION` (5432, `rs_server`) | migrate/seed scripts, CI | Yes |
| `DB_POOL_MAX` | web, vote, admin | No |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION` | web, studio | No |
| `SANITY_API_READ_TOKEN`, `SANITY_REVALIDATE_SECRET`, `SANITY_PREVIEW_SECRET` | web (and studio for preview) | Yes |
| `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` | web, vote, admin | Yes |
| `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` | all Next apps | DSN no / auth yes |
| `NEXT_PUBLIC_POSTHOG_KEY` | web | No |
| `CRON_SECRET`, `REVALIDATE_TOKEN` | admin → web | Yes |
| `VOTER_INVITE_SECRET` | admin, vote | Yes |
| `NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_VOTE_URL`, `NEXT_PUBLIC_ADMIN_URL` | all | No |
| `WEB_URL` (server absolute, for revalidate calls) | admin, vote | No |

Removed vs 1.1: `CFBD_API_KEY`, workers-only vars, `SANITY_API_WRITE_TOKEN` (not needed without ingestion workers).
