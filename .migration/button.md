# button

2026-10-03, engine (legacy `new-york` style, no base counterpart; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/button.tsx`: `Slot`/`asChild` replaced with the real `@base-ui/react/button` primitive. Props typed `ButtonPrimitive.Props & VariantProps<typeof buttonVariants>`. All cva classes (including `icon-xs`) unchanged.
- `packages/ui/src/components/combobox.tsx`: `InputGroupButton asChild` wrapping `ComboboxTrigger` → `render={<ComboboxTrigger />}`.
- `<Button asChild><Link/></Button>` call sites → `<Link className={buttonVariants(...)}>`, the pattern the app already used in `not-found.tsx` and the rankings/vote pages. `render={<Link/>}` with `nativeButton={false}` was rejected because Base UI's `useButton` sets `role="button"` on non-button elements, which would announce navigation links as buttons.
  - `apps/web/components/navbar.tsx` (search icon link, CTA)
  - `apps/web/app/search/page.tsx`
  - `apps/web/app/about/page.tsx`
  - `apps/web/app/authors/[slug]/page.tsx` (social links)
  - `apps/web/components/site-header/mobile-nav.tsx` (CTA inside `SheetClose`)
  - `apps/admin/app/(dashboard)/page.tsx`
- Leftover scan: `rg -n "radix-ui|@radix-ui" packages/ui/src/components/button.tsx` → clean.

## Left alone

- `SheetTrigger asChild` / `SheetClose asChild` in `mobile-nav.tsx`: belong to the sheet migration.
- Other `asChild` users (popover, dropdown, tooltip, sidebar triggers) are migrated with their own wrappers.

## Behavior changes

- Link-styled buttons are now plain `<a>` elements without the `data-slot="button"` attribute. Nothing in the app targets that attribute; visual output is identical.
- Combobox chevron now opens the list (previously the `asChild` merge could swallow the trigger click).

## Verify by hand

- Click the navbar search icon and CTA, the About/Search/Author page link buttons, and the admin dashboard buttons: each navigates.
- Tab through those links; focus ring shows and Enter navigates.
- Teams page combobox: clicking the chevron opens the list.
