# scroll-area

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/scroll-area.tsx`: Radix → `@base-ui/react/scroll-area`; `ScrollAreaScrollbar`/`ScrollAreaThumb` → `Scrollbar`/`Thumb`; types → `.Props`. Classes unchanged.
- Consumer checked (no `type` prop): `apps/admin/components/voting-panels.tsx`.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- Radix default `type="hover"` auto-hid the scrollbar; Base UI keeps it mounted while content overflows. Style `data-hovering`/`data-scrolling` on the scrollbar if you want it to fade.

## Verify by hand

- Admin → Voting panels: scroll a long voter list with wheel and by dragging the thumb.
