# sheet

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/sheet.tsx`: `@radix-ui/react-dialog` → `@base-ui/react/dialog`; Overlay → `Backdrop`, Content → `Popup`; types → `.Props`; `data-[state=…]:` → `data-open:`/`data-closed:` (slide/fade keyframes and 500ms-in / 300ms-out durations kept).
- `apps/web/components/site-header/mobile-nav.tsx`:
  - `SheetTrigger asChild><Button/>` → `SheetTrigger render={<Button …/>}`.
  - `SheetClose asChild` around nav links removed; the sheet is now controlled (`open`/`onOpenChange`) and each link calls `setOpen(false)` on click. Rendering a link through `Close` would have given it `role="button"`.
- Consumers checked: `apps/admin/components/voting-panels.tsx`, `publish-rankings-desk.tsx` (controlled `Sheet`), `sidebar.tsx` (mobile sheet, migrated with sidebar).
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- None intended. Mobile nav links still close the sheet on click.

## Verify by hand

- Mobile width: open the menu (slides from the left), click a link: navigates and the sheet closes; Escape/backdrop close; focus returns to the menu button.
- Admin → Voting panels: credential sheet opens and closes.
