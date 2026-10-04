# badge

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/badge.tsx`: Radix `Slot`/`asChild` → `useRender` + `mergeProps` (`render` prop); `data-slot="badge"` now comes from `state`. cva classes unchanged.
- Consumers checked (none used `asChild`): admin `voting-panels`, `ballot-inbox-voter` (+ test), `polls-manager`, `publish-rankings-desk`, `transfer-portal-manager`; web `college/teams/[slug]/page`, `match-badge`, `portal-status-badge`, `team-ranking-history`.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- None.

## Verify by hand

- Team page and admin ballot inbox: badges render with the same colors.
