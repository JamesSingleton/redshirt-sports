# apps/web — Agent Notes

## Test coverage (required)

`apps/web` enforces **100%** Vitest coverage (statements, branches, functions, lines) via thresholds in [`vitest.config.ts`](vitest.config.ts). Coverage includes `app/`, `components/`, `lib/`, `hooks/`, `utils/`, `actions/`, `server/`, and `proxy.ts`.

When changing code under those paths:

1. Add or update co-located tests under `__tests__/` (or next to the source) so every new branch/line is exercised.
2. Run `pnpm test` from `apps/web` (or `pnpm --filter @redshirt-sports/web test`) and **do not finish** until coverage reports 100%.
3. Do not lower global thresholds or exclude newly added source files to “make CI pass.” Prefer tests; only exclude generated or intentionally untested paths that already follow existing `coverage.exclude` patterns.
4. Prefer covering error paths (401/404/429/500, toast failures, empty data) and UI branches (conditional buttons, fallbacks), not only the happy path.

`CONTEXT.md` at the repo root is the domain glossary — keep product language there. Keep **engineering constraints** like this coverage rule in `AGENTS.md` files.
