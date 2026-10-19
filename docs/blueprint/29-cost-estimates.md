## 29. Cost estimates

All figures are **estimates in USD per month**, based on vendors' published list prices checked in October 2026 where noted. Usage-based lines depend on traffic. Verify before budgeting.

### 29.1 Platform services

| Service | Plan | MVP (estimate) | Growth (estimate) | Notes |
|---|---|---|---|---|
| Vercel | Pro (per member) + usage | $20–80 | $150–600+ | Four projects (web, vote, admin, studio). Sanity CDN via `sanity-image` avoids Vercel Image Optimization on editorial assets |
| Supabase | Pro ($25) + compute | $25–40 | $135–250 | Small/Medium/Large published list prices as before |
| Sanity | Growth ($15/seat) | $45–150 (3–10 seats) | $150–450 + add-ons | |
| Clerk | Pro ($25, or $20 annual) | $25 | $25 + $0.02/MRU over 50k | Shared sessions across subdomains; no extra satellite fee |
| Resend | Pro / Marketing | $20–40 | $80–300 | |
| Sentry | Team | $0–26 | $26–100 | |
| PostHog | Free tier → paid | $0 | $0–450 | |
| Upstash Redis (rate limits) | Pay-as-you-go | $0–10 | $10–30 | |
| Vercel Edge Config | Included tiers | $0 | $0–20 | Optional hot redirect mirror |
| Domain, DNS, email for staff | | $10–30 | $10–30 | |
| **Platform subtotal** | | **≈ $145–400** | **≈ $580–2,200+** | No sports-data feeds, no workers host |

### 29.2 Sports data

**None.** Schedules, scores and rosters are outbound links (§15). Bracket results and optional poll W-L records are staff-entered. If a future major version adds a feed, budget then — do not pre-pay.

### 29.3 One-time and people

| Item | Estimate |
|---|---|
| Build (Phases 0–2) | ~20–24 engineer-weeks (§28) |
| Design (brand, components, bracket UI) | §32 direction + mockups reduce this to ~1–2 designer-weeks of polish, or template-based |
| Legal (terms, privacy, contest rules for sponsored brackets) | At least one review before prizes or subscriptions |
| Photo licensing | Per image or wire/photo subscription |

### 29.4 Cost controls

- Tag-based revalidation over short timers.
- Serve editorial images from Sanity CDN with `sanity-image` (no double optimization).
- Skip Realtime until a group-page UX needs it.
- Use Supabase branching only for PRs that touch migrations.
- Turn PostHog session replay on only for specific flows.
