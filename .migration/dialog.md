# dialog

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/dialog.tsx`: Radix → `@base-ui/react/dialog`; Overlay → `Backdrop`, Content → `Popup` (centered, no Positioner); types → `.Props`; `data-[state=…]:` → `data-open:`/`data-closed:`; dropped the stray `data-slot` on the inner `DialogPortal` call.
- `packages/ui/src/components/command.tsx` (cmdk wrapper): only `CommandDialog`'s prop type changed to `Omit<…, "children"> & { children?: ReactNode }`, because Base UI Dialog `children` also accepts a payload render function. No cmdk code touched; `CommandDialog` is unused.
- Consumers:
  - `apps/admin/components/ballot-inbox-voter.tsx`: `DialogTrigger asChild>{trigger}` → `render={<Button size="sm" variant="outline" />}` with "Manage" as children (the `trigger` element is still used by the vaul `DrawerTrigger`).
  - `apps/admin/components/__tests__/ballot-inbox-voter.test.tsx`: `DialogTrigger` mock renders its `render` element.
  - Checked, no edits: `apps/admin/components/polls-manager.tsx`, `transfer-portal/entry-form-dialog.tsx`, `transfer-portal/player-form-dialog.tsx` (controlled `open`).
- Leftover scan: clean.

## Left alone

- `DrawerTrigger asChild` in `ballot-inbox-voter.tsx`: vaul, not radix.

## Behavior changes

- None observed. Base UI focuses the first tabbable element on open (same as Radix dialog).

## Verify by hand

- Admin ballot inbox (desktop width): Manage opens the dialog; Escape and the X close it; focus returns to Manage.
- Transfer portal: add/edit player and entry dialogs open, submit and close.
