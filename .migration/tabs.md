# tabs

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/tabs.tsx`: Radix → `@base-ui/react/tabs`; Trigger → `Tab`, Content → `Panel`; types → `.Props`; `data-[state=active]:` → `data-active:`; added `aria-disabled:` variants on the tab. `orientation` is still forwarded to Root.
- Consumers checked, no edits needed (string values, single-arg `onValueChange`):
  - `apps/web/components/rankings/transition-tabs.tsx`, `top25-card.tsx`
  - `apps/web/components/teams/team-ranking-history.tsx`
  - `apps/admin/components/transfer-portal/transfer-portal-manager.tsx`
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- Activation is now MANUAL: arrow keys move focus between tabs but don't switch panels until Enter/Space (Radix switched on focus). Not patched; add `activateOnFocus` to `TabsList` to restore the old feel.
- Inactive panels are unmounted unless `keepMounted` is set (same as Radix default).

## Verify by hand

- Home sidebar Top 25 card: click each division tab; panel cross-fades.
- Team page ranking history: switch polls; arrow keys move focus, Enter activates.
- Admin → Transfer portal: Players / Portal entries tabs.
