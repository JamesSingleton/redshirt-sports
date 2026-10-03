# toggle

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/toggle.tsx`: Radix Toggle Root → callable `@base-ui/react/toggle`; `data-[state=on]:` → `data-pressed:`; types → `TogglePrimitive.Props`.
- Only consumer is `toggle-group.tsx`.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- None.

## Verify by hand

- See toggle-group.
