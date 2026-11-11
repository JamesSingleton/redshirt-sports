# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Redshirt Sports is a college sports news website built as a Turborepo monorepo with Next.js apps and shared packages. The project uses Sanity CMS for content management, Postgres (via Drizzle ORM) for application data (ballots, rankings, etc.), and Clerk for authentication.

## Development Commands

### Building and Running

- `pnpm dev` - Start all apps in development mode (web on port 3000, admin on 3001, studio on default Sanity port)
- `pnpm build` - Build all apps and packages for production
- `pnpm lint` - Run Biome lint checks across all workspaces
- `pnpm check:types` - Run TypeScript type checks across all workspaces
- `pnpm check:format` - Run Biome format and lint checks on all files
- `pnpm test` - Run tests across all workspaces using Vitest
- `pnpm ci` - Run affected lint, typecheck, and test via Turborepo

### Workspace-Specific Commands

**Web App** (`apps/web`):

- `pnpm dev` - Next.js dev server on port 3000
- `pnpm test` - Run tests with Vitest
- `pnpm test:watch` - Run tests in watch mode
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run Drizzle migrations
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm check:types` - Run Next.js typegen and TypeScript check

**Admin App** (`apps/admin`):

- `pnpm dev` - Next.js dev server on port 3001
- `pnpm test` - Run tests with Vitest
- `pnpm test:watch` - Run tests in watch mode

**Studio** (`apps/studio`):

- `pnpm dev` - Start Sanity Studio in development mode
- `pnpm build` - Build Sanity Studio and deploy schema
- `pnpm type` - Extract schema and generate TypeScript types
- `pnpm check:types` - TypeScript check

**Sanity Functions** (`apps/functions`, deployed by the root `sanity.blueprint.ts`):

- Each function lives in `apps/functions/<name>/`; runtime deps go in `apps/functions/package.json`
- From the repo root: `pnpm blueprints:plan` previews a deploy, `pnpm blueprints:deploy` applies it
- `.sanity/blueprint.config.json` is committed and links the repo to the "production" stack. Never run `blueprints init` without `--stack-id`: it creates a second stack, and every function then runs twice

**Packages**:

- `packages/ui` - Run `pnpm test` or `pnpm test:watch` for component tests
- `packages/clients` - Run `pnpm test` or `pnpm test:watch` for API client tests
- `packages/db` - `pnpm test:integration` runs real-Postgres tests (locking, upserts, transactions) against a throwaway `redshirt_it` database on the local Supabase stack; it refuses any non-local host or other database name

### Running Individual Tests

To run a specific test file:

```bash
cd apps/web
pnpm vitest run path/to/test.test.ts
```

To run tests in a specific package:

```bash
pnpm --filter @redshirt-sports/ui test
pnpm --filter @redshirt-sports/clients test
```

## Architecture

### Monorepo Structure

This is a Turborepo monorepo with four applications and shared packages:

**Applications** (`apps/`):

- `web` - Main public-facing Next.js website
- `admin` - Internal admin dashboard (Next.js)
- `studio` - Sanity Studio CMS
- `functions` - Sanity Functions (deployed from the root `sanity.blueprint.ts`)

**Packages** (`packages/`):

- `ui` - Shared UI components (ShadCN components, Tailwind config)
- `db` - Drizzle ORM schema, client, and queries for Postgres
- `sanity` - Sanity client, queries, and TypeScript types
- `clients` - External API clients (ESPN, etc.)
- `auth` - Clerk authentication components and utilities
- `analytics` - PostHog and Plausible analytics integration
- `observability` - Sentry error monitoring
- `next-config` - Shared Next.js configuration
- `typescript-config` - Shared TypeScript configurations

### Data Layer Architecture

**Sanity CMS** (`packages/sanity`):

- Content data: posts, authors, tags, schools, sports, conferences, divisions
- Schema definitions live in `apps/studio/schemaTypes/`
- Queries centralized in `packages/sanity/src/queries.ts`
- Types auto-generated in `packages/sanity/src/types.ts`
- Used via `packages/sanity/src/client.ts`

**Postgres Database** (`packages/db`):

- Application data: voter ballots, rankings, user preferences, seasons
- Schema defined in `packages/db/src/schema.ts` using Drizzle ORM
- Database client in `packages/db/src/client.ts`
- Shared queries in `packages/db/src/queries/`
- Drizzle Kit config at `packages/db/drizzle.config.ts`

**Important**: There are two separate data stores:

- Sanity = content (posts, authors, editorial content)
- Postgres = application data (ballots, votes, rankings)

Some entities exist in both systems (e.g., sports, schools) where Sanity is the source of truth for editorial content and Postgres stores the IDs for relational app data.

### Web App Structure (`apps/web`)

**App Router Layout** (`app/`):

- Uses Next.js 16 App Router with route groups
- `(auth)/` - Authentication-related pages (sign-in, sign-up, onboarding)
- `college/[sport]/` - Sport-specific pages (news, rankings, teams)
- `authors/[slug]/` - Author profile pages
- `api/` - API routes (webhooks, cron jobs, RSS feeds)

**Key Directories**:

- `components/` - React components specific to web app
- `server/` - Server-side utilities (rate limiting, database helpers)
- `utils/` - Shared utilities (Redis, ESPN client, ballot processing)
- `actions/` - Server actions (e.g., complete-onboarding)
- `types/` - TypeScript type definitions
- `hooks/` - React hooks

**Environment Variables**:

- Managed with `@t3-oss/env-nextjs` in `app/env.ts`
- Validates environment variables at build time
- Copy `apps/web/.env.example` to `apps/web/.env.local` for development

### Admin App Structure (`apps/admin`)

Internal dashboard for managing ballots and development tools. Shares UI components from `packages/ui` and uses the same authentication system (Clerk) as the web app.

### Styling

- **Tailwind CSS v4** - All apps use Tailwind for styling
- **ShadCN UI** - Component library in `packages/ui`
- Shared Tailwind config in `packages/ui/tailwind.config.ts`
- Global styles in `packages/ui/src/styles/globals.css`

### Testing

**Vitest** is configured across multiple workspaces:

- Web app: `apps/web/vitest.config.ts` (happy-dom environment)
- Admin app: `apps/admin/vitest.config.ts`
- UI package: `packages/ui/vitest.config.ts`
- Clients package: `packages/clients/vitest.config.ts`

Test files use the pattern `*.test.ts` or `*.test.tsx` and are typically located in `__tests__/` directories or co-located with the source files.

## Key Patterns

### External API Clients

ESPN and other external API clients are defined in `packages/clients/` with:

- Type definitions using Zod schemas
- API functions with proper error handling
- Tests with fixtures in `__tests__/` directories

### Database Queries

- Centralize reusable queries in `packages/db/src/queries/`
- Use Drizzle ORM for type-safe database operations
- Run migrations with `pnpm db:migrate` before pushing schema changes

### Sanity Content

- Editorial house rules (headline, summary, body, image, byline limits and wording) live in `apps/studio/house-rules/` as plain functions with tests. Schema validation, the Story Check pane, and migrations all call them, so change a rule there, not in a schema file
- An article's division is a `classification` document (NCAA Division I; Studio labels it "Division"), plus an optional `sportSubgrouping` ("Subdivision": FBS, Mid-Major). Queries expose it under the key `division`, which routes and Postgres use. There is no `division` document type
- Article formats (`storyType`: news, analysis, feature, opinion, game preview, game recap) live in `packages/sanity/src/story-types.ts`, shared by Studio and site. Beats and series (Recruiting, Transfer Portal, NIL, Bowl Projections) are tags with a `kind`, not formats
- Players, rosters, recruiting data, and games never live in Sanity. Articles reference them as `"<provider>:<id>|<label>"` strings (`gameRef`, `playerRef`; see `packages/sanity/src/external-refs.ts`). `apps/studio/schemaTypes/__tests__/no-player-data.test.ts` fails if a player or game document type appears
- Article and legal bodies have one link annotation, `link` (`linkType`: internal reference, site path, or external URL). Older link formats are legacy and converted by migration
- A school's subdivision for a sport is its `conferenceAffiliations[].subgroupingOverride` when set, otherwise its conference's `sportSubdivisionAffiliations` entry for that sport
- Content migrations: see `apps/studio/migrations/README.md` for how filters behave and the run order
- All Sanity queries should use GROQ queries defined in `packages/sanity/src/queries.ts`
- Never follow a reference (`->`) inside a query filter: it runs once per candidate document and grows with every article published. Compare `_ref` against ids from a subquery that doesn't depend on the document (see `sportIdBySlug` in `queries.ts`). `->` in projections is fine
- Use the typed Sanity client from `packages/sanity/src/client.ts`
- Types are auto-generated - run `pnpm type` in `apps/studio` after schema changes

### Shared Components

- Add reusable UI components to `packages/ui/src/components/`
- Export components in package.json exports map
- Components use ShadCN patterns with Radix UI primitives

### Package Dependencies

When one workspace needs another, reference it in package.json:

```json
"dependencies": {
  "@redshirt-sports/ui": "workspace:*"
}
```

## Important Notes

- **Node Version**: Requires Node.js 22.12 or higher (see `package.json` engines field)
- **Package Manager**: Uses pnpm 10+ (see `packageManager` field)
- **Git Workflow**: Main branch is `main` - create feature branches for new work
- **License**: AGPL-3.0 - modifications must be made available under the same license
