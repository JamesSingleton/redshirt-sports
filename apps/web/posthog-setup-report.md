# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Redshirt Sports Next.js application. This integration provides comprehensive event tracking across both client-side and server-side code, covering key business workflows including voter ballot submission, user onboarding, search functionality, and engagement tracking.

## Integration Summary

### Setup Files Created/Modified

| File | Change |
|------|--------|
| `instrumentation-client.ts` | Added PostHog initialization alongside existing Sentry config |
| `lib/posthog-server.ts` | Created server-side PostHog client for API routes |
| `next.config.ts` | Added reverse proxy rewrites and CSP headers for PostHog |
| `components/contact-email-link.tsx` | Created client component for tracked email links |
| `.env` / `.env.example` | Added PostHog environment variables |

### Events Implemented

| Event Name | Description | File(s) |
|------------|-------------|---------|
| `ballot_submitted` | Voter successfully submits their Top 25 ballot | `app/api/vote/college/[sport]/rankings/[division]/route.ts` |
| `ballot_submission_error` | Error occurs when submitting a ballot | `components/forms/top-25.tsx` |
| `previous_ballot_populated` | User populates form with their previous ballot | `components/vote-form-wrapper.tsx` |
| `onboarding_completed` | User completes the onboarding process | `actions/complete-onboarding.ts` |
| `user_created` | New user created via Clerk webhook | `app/api/webhooks/auth/route.ts` |
| `user_updated` | User profile updated via Clerk webhook | `app/api/webhooks/auth/route.ts` |
| `search_performed` | User performs a search query | `components/search.tsx` |
| `rankings_filter_changed` | User changes year/week filter on rankings | `components/rankings/filters.tsx` |
| `contact_email_clicked` | User clicks on a contact email link | `app/contact/page.tsx` (via `contact-email-link.tsx`) |

### User Identification

- **Server-side**: Users are identified in the auth webhook when created/updated
- **Client-side**: PostHog automatically captures anonymous users; identified events link to server-side distinct IDs

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- [Analytics basics](https://us.posthog.com/project/310977/dashboard/1269811) - Core analytics dashboard with key metrics

### Insights
- [Ballots Submitted Over Time](https://us.posthog.com/project/310977/insights/rKgZIhIV) - Tracks ballot submission volume
- [Onboarding Funnel](https://us.posthog.com/project/310977/insights/9jXcRPCd) - User creation to onboarding completion conversion
- [Search Activity](https://us.posthog.com/project/310977/insights/wN36rGjG) - Search usage trends
- [Ballot Submission Errors](https://us.posthog.com/project/310977/insights/WIysDSIc) - Error monitoring for ballot submissions
- [User Engagement Overview](https://us.posthog.com/project/310977/insights/HyYMZU8d) - Combined view of key engagement metrics

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

## Technical Notes

- **Reverse Proxy**: PostHog events are sent through `/ingest/*` routes to avoid ad blockers
- **CSP Updates**: Content Security Policy headers updated to allow PostHog domains
- **Exception Tracking**: Automatic exception capture is enabled via `capture_exceptions: true`
- **Debug Mode**: PostHog debug mode is enabled in development environment
