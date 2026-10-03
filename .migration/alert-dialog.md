# alert-dialog

2026-10-03, engine (legacy `new-york` style; user classes kept, base registry shape), migrated cleanly.

## Changed

- `packages/ui/src/components/alert-dialog.tsx`:
  - Import `@base-ui/react/alert-dialog`; all prop types → `AlertDialogPrimitive.<Part>.Props`.
  - `Overlay` → `AlertDialogPrimitive.Backdrop`; `Content` → `AlertDialogPrimitive.Popup` (centered, no Positioner).
  - `data-[state=open|closed]:` animation classes → `data-open:` / `data-closed:`.
  - `AlertDialogAction` → plain `Button` (Base UI has no Action part).
  - `AlertDialogCancel` → `AlertDialogPrimitive.Close render={<Button variant size />}`.
- Consumers checked, no edits needed: `apps/admin/components/publish-rankings-desk.tsx`, `voting-panels.tsx`, `transfer-portal/transfer-portal-manager.tsx` (all controlled via `open`/`onOpenChange`).
- Leftover scan: `rg -n "radix-ui|@radix-ui" packages/ui/src/components/alert-dialog.tsx` → clean.

## Left alone

- `transfer-portal-manager.tsx:370` `event.preventDefault()` in the Action `onClick`: now a no-op (Action no longer auto-closes) but harmless.

## Behavior changes

- `AlertDialogAction` no longer closes the dialog on click. Every current consumer already closes it itself on success, so the dialog now stays open while the action is pending instead of vanishing immediately. Any future consumer must close it explicitly.

## Verify by hand

- Admin → Publish rankings: Publish and Unpublish confirm; dialog stays open while pending, closes on success, Cancel and Escape close it.
- Admin → Voting panels: remove voter access; dialog closes after click.
- Admin → Transfer portal: delete a player; focus returns to the trigger after close.
