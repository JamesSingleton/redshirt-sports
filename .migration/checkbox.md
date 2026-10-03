# checkbox

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/checkbox.tsx`: Radix → `@base-ui/react/checkbox`; `data-[state=checked]:` → `data-checked:`; `disabled:` → `data-disabled:` (Root is a `<span>`).
- `packages/ui/src/components/field.tsx:119`: `has-data-[state=checked]:` → `has-data-checked:` on the choice-card label.
- No app consumers import this wrapper.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- `checked="indeterminate"` is now a separate `indeterminate` boolean (no current usage).

## Verify by hand

- None needed (unused in apps).
