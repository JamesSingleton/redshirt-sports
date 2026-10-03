# select

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated with consumer fixes.

## Changed

- `packages/ui/src/components/select.tsx`: `@radix-ui/react-select` → `@base-ui/react/select`; types → `SelectPrimitive.*.Props`; `Select` is `SelectPrimitive.Root` directly so its value generic flows through.
  - Content → Portal > Positioner (`isolate z-50`; `side`/`sideOffset`/`align`/`alignOffset`/`alignItemWithTrigger` declared, destructured, forwarded) > Popup. The wrapper's Radix default `position="popper"` → `alignItemWithTrigger = false`; Radix popper's `align="start"` default kept explicitly (Base defaults to center).
  - `data-[state=…]:` → `data-open:`/`data-closed:`; `max-h-(--radix-select-content-available-height)` → `max-h-(--available-height)`; `origin-(--radix-select-content-transform-origin)` → `origin-(--transform-origin)`. The popper-mode `translate-*` nudges are kept, keyed on `!alignItemWithTrigger`.
  - Viewport → `List`; `min-w-[var(--radix-select-trigger-width)]` → `min-w-(--anchor-width)`. Dropped `h-[var(--radix-select-trigger-height)]`: it only worked because Radix's viewport is `flex: 1` inside a flex column; in Base UI the List is a plain block and that height would clip it to the trigger's height.
  - `Icon asChild` → the chevron passed as `Icon` children with `className="flex"` (passing it through `render` merges Base UI's default "▼" text into the svg).
  - Label → `GroupLabel`; ScrollUpButton/ScrollDownButton → `ScrollUpArrow`/`ScrollDownArrow`, with `bg-popover top-0`/`bottom-0 z-10 w-full` added because Base UI positions the arrows absolutely.
- Consumers. Base UI's `Select.Value` renders the raw value unless `items` is on the Root (Radix rendered the selected item's text), and `onValueChange` now receives `string | null`:
  - `items` added where labels differ from values: `apps/admin/components/polls-manager.tsx`, `publish-rankings-desk.tsx` (poll, week), `ballot-inbox-voter.tsx`, `transfer-portal/entry-form-dialog.tsx` (`STATUS_LABELS`), `transfer-portal/player-form-dialog.tsx` (sport, `{ none: "Unknown" }`), `apps/web/components/transfer-portal/wire-filters.tsx` (status, position, conference "All …" labels), `rankings/filters.tsx` (week), `rankings/voter-ballot-breakdown/index.tsx` (sort, page size).
  - `onValueChange` handlers guard `null` before calling `string` setters in all of the above plus `apps/web/components/teams/team-ranking-history.tsx` and the year selects. No item has a `null` value, so the guard never fires in practice.
- Leftover scan: clean.

## Left alone

- Year selects (`publish-rankings-desk.tsx`, `wire-filters.tsx`, `team-ranking-history.tsx`, `rankings/filters.tsx`) need no `items`: their labels equal their values.
- Test mocks of `@redshirt-sports/ui/components/select` in `apps/web/__tests__/components/rankings/filters.test.tsx` and `apps/admin/components/__tests__/ballot-inbox-voter.test.tsx` still pass unchanged.

## Behavior changes

- `ItemText` renders a `<div>` (Radix `<span>`), so the item's `*:[span]:last:flex …` classes no longer match it. Only matters for items with inline icons; none exist.
- `collisionPadding` default 5 (Radix popper 10).
- Base UI Select is `modal` by default (page scroll locked while open), like Radix.
- Scroll arrows don't render on touch input.

## Verify by hand

- Rankings week page: Year/Ranking triggers show "2026"/"Week N"; picking a week navigates; keyboard: open with Enter, arrow keys, typeahead "W", Enter selects, Escape closes and refocuses the trigger.
- Voter breakdown: Sort shows "Name"/"Match %"; page size opens upward and shows "N per page".
- Admin: poll/sport/week/status/class selects show names, not IDs; the transfer-portal player form's class shows "Unknown" for no class.
- Transfer portal filters (web): "All statuses/positions/conferences" labels show when unfiltered.
