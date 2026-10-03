# separator

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/separator.tsx`: Radix Root → callable `@base-ui/react/separator`; `decorative` prop removed; types → `SeparatorPrimitive.Props`. `data-[orientation=…]` classes unchanged (Base UI sets the same attribute).
- Consumers checked (none pass `decorative`): `sidebar.tsx`, `item.tsx`, `field.tsx`, `apps/admin/app/(dashboard)/page.tsx`, `apps/admin/components/site-header.tsx`, `voting-panels.tsx`, `apps/web/components/site-header/mobile-nav.tsx`.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- The wrapper defaulted to `decorative` (`role="none"`). Base UI separators always render `role="separator"`, so screen readers now announce every divider. If that is noisy, render a `<div aria-hidden>` for purely visual rules.

## Verify by hand

- Admin header and mobile nav: dividers render at the same thickness/orientation.
