# Redshirt Sports platform blueprint, v1.7 (handoff edition)

The target architecture for evolving this repo. Start with **[BUILD_ORDER.md](BUILD_ORDER.md)** (Milestone 0 is the repo audit plus local-stack check), **[LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)** and **[OPEN_DECISIONS.md](OPEN_DECISIONS.md)**.

> **Handoff notes.** (1) This is an *evolution* of the existing repo: migrate incrementally, keep the site live, and give moved URLs legacy 301s. The repo's package names and paths win over the blueprint's (`@rs/*` → `@redshirt-sports/*`). (2) **Local only:** agents never touch remote or production databases, deploys or secrets. (3) **Transfer Portal Tracker:** in scope, but the **UI needs a redesign before build** (Decision #17), and the **story link is optional pending Decision #16**. (4) **v1.7 rankings and ballots** (§13.9, §13.11, §32.11–32.11d): the ballot breakdown defaults to the unfiltered all-voters grid, a new By voter view (`…/ballots/by-voter`), "On X of N ballots" instead of ballot share, a "See all N ballots" CTA, Dropped out / No longer receiving votes, and Voters, History (`…/fcs/history`) and Methodology tabs. (5) **v1.6 URLs are level → sport:** `/college` level hub, then `/college/football/…`, `/college/mens-basketball/…`, `/college/womens-basketball/…`; `/high-school/…` is reserved for later. This matches the repo's current URL shape, so few redirects are needed. (6) Fan vote and build-your-own Top 25 were removed in v1.5. (7) Third-party reference screenshots (On3, MarchArena) are not included.

## Working files

| File | Purpose |
|---|---|
| [BUILD_ORDER.md](BUILD_ORDER.md) | Milestones with checkboxes (from Appendix D), plus Milestone 0: audit and local-stack check |
| [REPO_AUDIT.md](REPO_AUDIT.md) | Starter audit: what the repo already matches and the conflicts to decide (A1–A14) |
| [OPEN_DECISIONS.md](OPEN_DECISIONS.md) | Decisions that shape the first PRs (#16 story link, #17 tracker redesign, #18 residual URL moves, #19 vote subdomain) |
| [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) | Local Supabase, the dev Sanity dataset, Clerk dev keys, Resend test mode, `pnpm dev:setup`, the guard script |
| [local-dev/](local-dev/) | Example Sanity fixtures (fake) and an outline for the Postgres example seed |
| [sports-platform-blueprint-v1.7.md](sports-platform-blueprint-v1.7.md) | The whole blueprint in one file (same content as the sections below) |
| [../mockups/](../mockups/) | Static HTML mockups, compiled CSS, fonts and screenshots |

## Sections

The section numbers (§n) used across the docs match these files. Cross-references like "§17.3" point into `17-*.md`.

| File | Section |
|---|---|
| [00-front-matter.md](00-front-matter.md) | Front matter: title, how to read, handoff note, change log |
| [01-executive-summary.md](01-executive-summary.md) | 1. Executive summary |
| [02-reference-sites-what-each-does-well.md](02-reference-sites-what-each-does-well.md) | 2. Reference sites: what each does well |
| [03-feature-map.md](03-feature-map.md) | 3. Feature map |
| [04-architecture-overview.md](04-architecture-overview.md) | 4. Architecture overview |
| [05-system-responsibility-split.md](05-system-responsibility-split.md) | 5. System responsibility split |
| [06-turborepo-monorepo-layout-pnpm-and-tooling.md](06-turborepo-monorepo-layout-pnpm-and-tooling.md) | 6. Turborepo monorepo layout, pnpm and tooling |
| [07-ci-cd-and-vercel-deployment.md](07-ci-cd-and-vercel-deployment.md) | 7. CI/CD and Vercel deployment |
| [08-identity-clerk-roles-orgs-webhooks-and.md](08-identity-clerk-roles-orgs-webhooks-and.md) | 8. Identity: Clerk, roles, orgs, webhooks and Supabase third-party auth |
| [09-canonical-data-model-schools-teams-conferences.md](09-canonical-data-model-schools-teams-conferences.md) | 9. Canonical data model: schools, teams, conferences, seasons |
| [10-postgres-schema-and-the-drizzle-data.md](10-postgres-schema-and-the-drizzle-data.md) | 10. Postgres schema and the Drizzle data access layer |
| [11-row-level-security-policies.md](11-row-level-security-policies.md) | 11. Row Level Security policies |
| [12-sanity-content-model-groq-and-studio.md](12-sanity-content-model-groq-and-studio.md) | 12. Sanity content model, GROQ and Studio |
| [13-top-25-polls-full-lifecycle.md](13-top-25-polls-full-lifecycle.md) | 13. Top 25 polls: full lifecycle |
| [14-bracket-challenge-full-design.md](14-bracket-challenge-full-design.md) | 14. Bracket Challenge: full design |
| [15-external-links-instead-of-a-sports.md](15-external-links-instead-of-a-sports.md) | 15. External links instead of a sports-data product |
| [16-transfer-portal-and-recruiting-hubs-article.md](16-transfer-portal-and-recruiting-hubs-article.md) | 16. Transfer portal and recruiting hubs (article-driven) |
| [17-route-map-and-url-structure-designed.md](17-route-map-and-url-structure-designed.md) | 17. Route map and URL structure (designed from scratch) |
| [18-rendering-and-caching-strategy.md](18-rendering-and-caching-strategy.md) | 18. Rendering and caching strategy |
| [19-seo-and-aeo.md](19-seo-and-aeo.md) | 19. SEO and AEO |
| [20-monetization.md](20-monetization.md) | 20. Monetization |
| [21-notifications-newsletter-mobile-and-pwa.md](21-notifications-newsletter-mobile-and-pwa.md) | 21. Notifications, newsletter, mobile and PWA |
| [22-observability.md](22-observability.md) | 22. Observability |
| [23-testing-strategy.md](23-testing-strategy.md) | 23. Testing strategy |
| [24-security.md](24-security.md) | 24. Security |
| [25-accessibility.md](25-accessibility.md) | 25. Accessibility |
| [26-performance-budgets-and-image-rules.md](26-performance-budgets-and-image-rules.md) | 26. Performance budgets and image rules |
| [27-legacy-redirects-from-the-current-site.md](27-legacy-redirects-from-the-current-site.md) | 27. Legacy redirects from the current site (optional, one-time 301s) |
| [28-phased-roadmap-and-effort.md](28-phased-roadmap-and-effort.md) | 28. Phased roadmap and effort |
| [29-cost-estimates.md](29-cost-estimates.md) | 29. Cost estimates |
| [30-open-decisions-and-risks.md](30-open-decisions-and-risks.md) | 30. Open decisions and risks |
| [31-user-retention-strategy.md](31-user-retention-strategy.md) | 31. User retention strategy |
| [32-ui-ux-direction-and-design-system.md](32-ui-ux-direction-and-design-system.md) | 32. UI/UX direction and design system |
| [appendix-a-bracket-templates.md](appendix-a-bracket-templates.md) | Appendix A: Bracket templates |
| [appendix-b-environment-variables.md](appendix-b-environment-variables.md) | Appendix B: Environment variables |
| [appendix-c-glossary.md](appendix-c-glossary.md) | Appendix C: Glossary |
| [appendix-d-build-order-for-cursor.md](appendix-d-build-order-for-cursor.md) | Appendix D: Build order for Cursor |
