# item

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/item.tsx`: `Item` Radix `Slot`/`asChild` → `useRender` + `mergeProps`; `data-slot`/`data-variant`/`data-size` now come from `state`. Classes unchanged.
- No app consumers import this wrapper.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- None.

## Verify by hand

- None needed (unused in apps).
