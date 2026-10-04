# avatar

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/avatar.tsx`: `@radix-ui/react-avatar` → `@base-ui/react/avatar`; `forwardRef` wrappers → plain functions (React 19 `ref` prop); types → `AvatarPrimitive.<Part>.Props`. Classes unchanged.
- Consumers checked (no `delayMs`): `apps/admin/components/nav-user.tsx`, `voting-panels.tsx`.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- None.

## Verify by hand

- Admin sidebar user menu: avatar image loads; with a broken image URL the initials fallback shows.
