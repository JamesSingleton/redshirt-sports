## 24. Security

| Area | Control |
|---|---|
| AuthN | Clerk; MFA required for staff and voters; session lifetime shorter for admin app |
| AuthZ | Role checks in middleware (coarse) + every server action/route (`requireRole`, `requireVoter(pollId)`) + RLS + security-definer functions with `search_path` pinned |
| Voter invites | HMAC-signed tokens (`VOTER_INVITE_SECRET`, rotatable; rotation invalidates outstanding links), only hashes stored, single-use and expiring, bound to verified email, admin-only creation with audit |
| Database roles | Runtime uses `rs_server` (DML only, `BYPASSRLS`); migrations use `postgres` from CI only; `withRls` uses transaction-local settings safe for Supavisor transaction mode |
| Secrets | Vercel env vars per environment; Supabase secret key only in server code (`server-only`); Vault for secrets used by pg_cron; rotate on staff departure |
| Webhooks | Verify signatures (svix for Clerk/Resend, Sanity signature, Stripe signature); reject replay via `webhook_events` dedupe; return 2xx only after processing |
| Cron endpoints | `Authorization: Bearer` with constant-time compare; Vercel Cron `CRON_SECRET` |
| Input validation | zod on every action; DB constraints as last line |
| Rate limiting | Upstash Ratelimit (or Postgres-based) on ballots, picks, joins, newsletter, search, invite acceptance, contact forms |
| Bots | Clerk bot protection on sign-up; Cloudflare Turnstile on public forms; Vercel Firewall / BotID rules for abusive patterns |
| Headers | CSP with nonces (Next.js middleware), `frame-ancestors 'none'` except Sanity Presentation origin for draft mode, HSTS preload, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimal |
| XSS | Portable Text renderer only (no raw HTML); embeds via allow-listed components; sanitize any user text (group names, bracket names) on output (React escapes by default) |
| CSRF | Server actions have built-in origin checks; route handlers that mutate check `Origin` |
| Data privacy | Minimal PII; IPs stored as salted hashes; data export/delete requests via `/account/privacy`; DPA with vendors; privacy policy covering Clerk, Supabase, Sanity, PostHog, Sentry, Resend, ad partners |
| Minors | Recruiting coverage of minors: no contact details, publish only public info; account sign-ups: Terms set a minimum age; delete accounts known to be under 13 (COPPA) |
| Supabase | Network restrictions on the DB, SSL enforced, PITR backups enabled, `anon` has no grants on private tables, Supabase security advisor clean |
| Sanity | Least-privilege tokens (read-only token for web, write token only if an admin job needs it), CORS origins limited, dataset private for drafts |
| Audit | Poll and bracket audit logs append-only; admin role changes logged |
| Incident response | Runbook: rotate keys, revoke sessions (Clerk), freeze poll week, communicate on the poll page |
| Dependencies | Renovate with grouped updates; `pnpm audit` in CI; lockfile-only installs |
