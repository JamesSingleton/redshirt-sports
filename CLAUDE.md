# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Redshirt Sports is a college sports news website built as a Turborepo monorepo with Next.js apps and shared packages. The project uses Sanity CMS for content management, Postgres (via Drizzle ORM) for application data (ballots, rankings, etc.), and Clerk for authentication.

## Development Commands

### Building and Running
- `pnpm dev` - Start all apps in development mode (web on port 3000, admin on 3001, studio on default Sanity port)
- `pnpm build` - Build all apps and packages for production
- `pnpm lint` - Run ESLint across all workspaces
- `pnpm check:types` - Run TypeScript type checks across all workspaces
- `pnpm check:format` - Run Prettier check on all files
- `pnpm test` - Run tests across all workspaces using Vitest

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

**Packages**:
- `packages/ui` - Run `pnpm test` or `pnpm test:watch` for component tests
- `packages/clients` - Run `pnpm test` or `pnpm test:watch` for API client tests

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

This is a Turborepo monorepo with three applications and six shared packages:

**Applications** (`apps/`):
- `web` - Main public-facing Next.js website
- `admin` - Internal admin dashboard (Next.js)
- `studio` - Sanity Studio CMS

**Packages** (`packages/`):
- `ui` - Shared UI components (ShadCN components, Tailwind config)
- `db` - Drizzle ORM schema, client, and queries for Postgres
- `sanity` - Sanity client, queries, and TypeScript types
- `clients` - External API clients (ESPN, etc.)
- `eslint-config` - Shared ESLint configuration
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
- All Sanity queries should use GROQ queries defined in `packages/sanity/src/queries.ts`
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

- **Node Version**: Requires Node.js 20 or higher (see `package.json` engines field)
- **Package Manager**: Uses pnpm 10+ (see `packageManager` field)
- **Git Workflow**: Main branch is `main` - create feature branches for new work
- **License**: AGPL-3.0 - modifications must be made available under the same license
