# label

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/label.tsx`: `@radix-ui/react-label` Root → native `<label>` (no Base UI counterpart). Classes unchanged, including `select-none` which covers Radix's double-click selection guard. Biome `noLabelWithoutControl` suppressed on the wrapper since consumers supply `htmlFor`.
- Consumers checked, no edits needed: `packages/ui/src/components/form.tsx`, `field.tsx`, `apps/admin/components/polls-manager.tsx`.
- Leftover scan: `rg -n "radix-ui|@radix-ui" label.tsx` → clean.

## Left alone

- `form.tsx` still imports Radix `Slot`; migrated with form.

## Behavior changes

- `peer-disabled:` on Label only reacts to native disabled inputs. Base UI Switch/Checkbox roots are `<span>`s, so a Label placed after a disabled Switch/Checkbox no longer dims. No current consumer pairs them that way with `disabled`.

## Verify by hand

- Admin → Polls: click each label; focus moves to its input.
