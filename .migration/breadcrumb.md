# breadcrumb

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/breadcrumb.tsx`: `BreadcrumbLink` Radix `Slot`/`asChild` → `useRender` + `mergeProps` (`render` prop). Other parts are plain elements, unchanged.
- `packages/ui/src/components/__tests__/breadcrumb.test.tsx`: `asChild` test → `render={<button />}`.
- No app consumers import this wrapper.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- None.

## Verify by hand

- Run `pnpm --filter @redshirt-sports/ui test`.
