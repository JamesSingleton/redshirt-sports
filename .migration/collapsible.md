# collapsible

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/collapsible.tsx`: `@radix-ui/react-collapsible` → `@base-ui/react/collapsible`; Content → `Panel`; types → `.Props`.
- Consumer: `packages/ui/src/components/sidebar.tsx` uses it only through the sidebar's own parts (checked with the sidebar migration). No app consumers.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- Trigger open state is `data-panel-open` (was `data-state=open`); Panel uses `data-open`/`data-closed`.

## Verify by hand

- None needed (unused in apps).
