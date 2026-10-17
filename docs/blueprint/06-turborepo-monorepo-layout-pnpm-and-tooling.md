## 6. Turborepo monorepo layout, pnpm and tooling

### 6.1 Directory tree

```text
redshirt/
├── apps/
│   ├── web/                    # www.redshirtsports.com — news, hubs, rankings, public brackets, page builder
│   ├── vote/                   # vote.redshirtsports.com — invite acceptance, ballot editor, voter home
│   ├── admin/                  # admin.redshirtsports.com — staff only: poll ops, invites, bracket results, roles
│   └── studio/                 # Sanity Studio (studio.redshirtsports.com or *.sanity.studio)
├── packages/
│   ├── ui/                     # shadcn/ui components, Tailwind preset, design tokens, icons, SanityImage wrapper
│   ├── config/                 # tsconfig bases, biome config, tailwind config, vitest config
│   ├── env/                    # @t3-oss/env-nextjs schemas shared across apps
│   ├── db/                     # Drizzle ORM: TS schema (tables, indexes, RLS), drizzle-kit, typed queries, adminDb + withRls
│   ├── auth/                   # Clerk helpers, authorizedParties, getCurrentUser, requireRole, webhook verification
│   ├── sanity/                 # Sanity schemas, GROQ queries, typegen, client, sanity-image helpers
│   ├── polls/                  # Pure: invite tokens, ballot validation, tabulation, movement, anti-abuse heuristics
│   ├── brackets/               # Pure: format registry, resolve, validate, score, rank/tiebreak
│   ├── seo/                    # Metadata, JSON-LD, sitemap builders, OG templates, urls.ts, reserved paths
│   ├── analytics/              # PostHog wrappers, event name constants
│   ├── observability/          # Sentry init helpers, logger
│   ├── emails/                 # React Email templates for Resend
│   ├── billing/                # Entitlements, metering (later)
│   └── testing/                # Factories, fixtures (bracket formats, ballots), Postgres test harness
├── supabase/                   # config.toml, migrations/ (from drizzle-kit), tests/ (pgTAP), functions/ (optional)
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── biome.json
└── .github/workflows/
```

**Why `supabase/` at the root:** the Supabase CLI expects one project directory for the local stack, pgTAP tests, Edge Functions and preview branches. drizzle-kit writes its migrations into `supabase/migrations` with the Supabase-compatible file prefix, so both tools read the same SQL files (§10.11). Types come from the Drizzle schema (`$inferSelect`), not from `supabase gen types`.

### 6.1a Apps and domains (web, vote, admin, studio)

There is **no `apps/workers`** and no ingestion service. Scheduled jobs (poll tick, reminders, newsletters, invite expiry, role reconcile) are Vercel Cron route handlers in `apps/admin` (§13.14).


| App | Domain | Audience | Owns |
|---|---|---|---|
| `apps/web` | `www.redshirtsports.com` | Readers | News, hubs, rankings display, brackets (public), page builder, SEO |
| `apps/vote` | `vote.redshirtsports.com` | Invited voters | Invite acceptance, ballot editor, voter home, own ballot history |
| `apps/admin` | `admin.redshirtsports.com` | Staff only | Poll ops, voter invites/rosters, bracket field + **manual results**, data corrections, roles |
| `apps/studio` | `studio.redshirtsports.com` (or `*.sanity.studio`) | Editors | Sanity Studio |

Voting does **not** live on `admin.`. A voter who bookmarks `admin.` and has no staff role gets a clear "wrong site" page that links to `vote.`.

#### Clerk: shared session across subdomains (not satellites)

`www`, `vote` and `admin` are all subdomains of **`redshirtsports.com`**. In production Clerk shares the session cookie across that root domain. You do **not** need Clerk satellite domains (those are for a *different* root domain).

Setup:

1. Clerk production instance: primary domain `redshirtsports.com` (or `www.redshirtsports.com` per Clerk's current primary-domain rules — follow the dashboard wizard).
2. Enable **Allowed Subdomains** and allowlist exactly: `www.redshirtsports.com`, `vote.redshirtsports.com`, `admin.redshirtsports.com` (and `studio` only if Studio uses Clerk, which it should not).
3. In every app's `clerkMiddleware` / `<ClerkProvider>`, set `authorizedParties` to that same allowlist so a compromised sibling subdomain cannot mint trusted sessions for the others.
4. Sign-in/sign-up UI can live on `www` (account) and/or `vote` (voter-first). Prefer one primary sign-in host (`www.redshirtsports.com/sign-in`) and link others there with `redirect_url` back, so users see one familiar surface. After sign-in on `www`, visiting `vote.` is already authenticated (shared cookie).
5. Development: three localhost ports do **not** share cookies. Use Clerk's development instance with three apps pointing at it, and accept re-auth per port — or use a tool like `lvh.me` / local DNS + HTTPS. Document the chosen local approach in `apps/vote/README.md`.

```ts
// packages/auth/src/authorized-parties.ts
export const AUTHORIZED_PARTIES = [
  "https://www.redshirtsports.com",
  "https://vote.redshirtsports.com",
  "https://admin.redshirtsports.com",
] as const;

// apps/vote/middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { AUTHORIZED_PARTIES } from "@rs/auth/authorized-parties";
export default clerkMiddleware({ authorizedParties: [...AUTHORIZED_PARTIES] });
```

Staff gate on `apps/admin`: every route requires a staff role (`admin`, `poll_admin`, `bracket_admin`, `data_admin`, `editor`). Voters without a staff role get a 403 "Staff only" page with a link to `vote.` (no redirect).




### 6.2 `pnpm-workspace.yaml` with catalogs

```yaml
packages:
  - "apps/*"
  - "packages/*"

catalog:
  next: ^16.0.0
  react: ^19.2.0
  react-dom: ^19.2.0
  typescript: ^5.9.0
  zod: ^4.1.0
  "@clerk/nextjs": ^6.0.0
  "@supabase/supabase-js": ^2.50.0
  drizzle-orm: ^0.44.0
  drizzle-kit: ^0.31.0
  drizzle-zod: ^0.8.0
  postgres: ^3.4.0
  next-sanity: ^11.0.0
  sanity: ^4.0.0
  tailwindcss: ^4.1.0
  vitest: ^3.2.0
  "@sentry/nextjs": ^10.0.0
  posthog-js: ^1.250.0
  posthog-node: ^5.0.0
  resend: ^6.0.0
```

> Versions are illustrative. Use whatever is current when you scaffold, and keep them in the catalog so every app moves together.

### 6.3 Root `package.json`

```json
{
  "name": "redshirt",
  "private": true,
  "packageManager": "pnpm@10.17.0",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "db:start": "supabase start",
    "db:reset": "supabase db reset",
    "db:generate": "pnpm --filter @rs/db exec drizzle-kit generate",
    "db:custom": "pnpm --filter @rs/db exec drizzle-kit generate --custom",
    "db:migrate": "pnpm --filter @rs/db exec drizzle-kit migrate",
    "db:check": "pnpm --filter @rs/db exec drizzle-kit check",
    "db:seed": "pnpm --filter @rs/db exec tsx src/seed.ts",
    "db:studio": "pnpm --filter @rs/db exec drizzle-kit studio",
    "sanity:typegen": "pnpm --filter @rs/sanity typegen",
    "format": "biome format --write ."
  },
  "devDependencies": {
    "turbo": "^2.5.0",
    "@biomejs/biome": "^2.2.0",
    "typescript": "catalog:"
  }
}
```

### 6.4 `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "globalEnv": ["NODE_ENV", "VERCEL_ENV"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"],
      "env": [
        "NEXT_PUBLIC_*",
        "SANITY_*",
        "CLERK_*",
        "SUPABASE_*",
        "SENTRY_*",
        "RESEND_API_KEY"
      ]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "test:e2e": { "dependsOn": ["build"], "cache": false },
    "typegen": { "outputs": ["src/sanity.types.ts", "schema.json"] }
  }
}
```

### 6.5 Package conventions

| Rule | Detail |
|---|---|
| Naming | `@rs/<name>`; apps are `@rs/web`, `@rs/vote`, `@rs/admin`, `@rs/studio` |
| Internal packages | "Just-in-time" TypeScript packages: `exports` points to `src/*.ts`, consuming Next apps list them in `transpilePackages`. No separate build step. Pure packages (`polls`, `brackets`) are also importable in Vitest without Next. |
| Boundaries | `packages/polls` and `packages/brackets` are **pure** (no DB, no network). DB access lives in `packages/db/queries/*`. Engines are unit-testable and usable in the browser for pick previews. |
| Server-only | Packages that touch secrets import `server-only` at the top. |
| Exports | Each package exposes subpaths, e.g. `@rs/db/queries`, `@rs/db/types`, `@rs/sanity/queries`, `@rs/sanity/schemas`, `@rs/auth/server`, `@rs/auth/client`. |

Example `packages/brackets/package.json`:

```json
{
  "name": "@rs/brackets",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./formats": "./src/formats/index.ts",
    "./scoring": "./src/scoring.ts"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "build": "tsup src/index.ts --format esm --dts"
  },
  "dependencies": { "zod": "catalog:" },
  "devDependencies": { "vitest": "catalog:", "tsup": "^8.5.0", "@rs/config": "workspace:*" }
}
```

### 6.6 `packages/ui` with shadcn/ui

- Initialize with the shadcn CLI's monorepo support so components land in `packages/ui/src/components` and apps import `@rs/ui/components/button`.
- Tailwind v4: put tokens in `packages/ui/src/styles/globals.css` with `@theme` and import it from each app's root layout. Apps add `@source "../../packages/ui/src";` so classes in the package are scanned.
- Sports-specific components belong here too: `TeamLogo`, `RankBadge`, `MovementArrow`, `PollTable`, `BracketGrid`, `CountdownToLock`, `OutboundLinkCard` (for "Official schedule" / "Roster" / "Scores" cards on hubs).
- `SanityImage` wraps the `sanity-image` library with projectId/dataset defaults (§26).
- Theming per school: CSS variables `--team-primary`, `--team-secondary` set on team hub layouts from Sanity colors, with a contrast check (fall back to neutral if WCAG AA fails).

```css
/* packages/ui/src/styles/globals.css */
@import "tailwindcss";
@theme {
  --color-brand: oklch(0.55 0.2 25);
  --color-surface: oklch(0.99 0 0);
  --font-sans: "Inter Variable", system-ui, sans-serif;
  --font-display: "Oswald Variable", var(--font-sans);
}
```

### 6.7 Local development

1. `pnpm i`
2. `supabase start` (Docker), then `pnpm db:migrate` and `pnpm db:seed` (schools, conferences, seasons, a sample poll with invited voters, an FCS bracket event with a few slots filled). `pnpm db:reset` rebuilds from scratch. `pnpm db:studio` opens Drizzle Studio.
3. Sanity: use a `development` dataset; `pnpm --filter @rs/studio dev`.
4. Clerk: development instance; set the Supabase third-party auth integration for local using the Clerk dev domain.
5. `pnpm dev` runs web (3000), vote (3001), admin (3002), studio (3333). Local Clerk sessions do not share across ports; see §6.1a.
6. Webhooks locally: `ngrok` or `cloudflared` tunnel for Clerk and Sanity webhooks, or use Clerk's dev webhook replay.
