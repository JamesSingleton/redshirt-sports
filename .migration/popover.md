# popover

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/popover.tsx`: Radix → `@base-ui/react/popover`. Content → Portal > Positioner (`isolate z-50`, receives `side`/`sideOffset`/`align`/`alignOffset`, all declared, destructured and forwarded) > Popup. `data-[state=…]:` → `data-open:`/`data-closed:`; `origin-(--radix-popover-content-transform-origin)` → `origin-(--transform-origin)`.
- `PopoverAnchor` removed: no Base UI part (anchor is a Positioner prop) and nothing imported it.
- Consumers: `PopoverTrigger asChild><Button/>` → `PopoverTrigger render={<Button …/>}` with children moved in:
  - `apps/web/components/virtualized-combobox.tsx` (`ref={triggerRef}` kept on the render element; Base UI merges it)
  - `apps/web/components/news/filter-combobox.tsx`
  - `apps/admin/components/transfer-portal/school-combobox.tsx`
  - `apps/admin/components/voting-panels.tsx`
- `w-(--radix-popover-trigger-width)` → `w-(--anchor-width)` in `filter-combobox.tsx` and `school-combobox.tsx`.
- Leftover scan: clean.

## Left alone

- Popover content uses cmdk `Command` (not radix).

## Behavior changes

- Base UI's default `collisionPadding` is 5 (Radix 0): popovers keep 5px off the viewport edge.

## Verify by hand

- News page filter combobox: opens below the trigger at the trigger's width (mobile), filters, selects, closes; Escape returns focus to the trigger.
- Vote page school picker: list width matches the trigger.
- Admin: "Add to panel" popover aligns to the button's end; transfer-portal school picker matches trigger width.
