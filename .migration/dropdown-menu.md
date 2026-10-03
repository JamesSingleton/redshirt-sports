# dropdown-menu

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated with consumer fixes.

## Changed

- `packages/ui/src/components/dropdown-menu.tsx`: `@radix-ui/react-dropdown-menu` → `@base-ui/react/menu`; `forwardRef` wrappers → function components typed with `MenuPrimitive.*.Props`; `data-slot`s added.
  - Content and SubContent → Portal > Positioner (`isolate z-50 outline-none`; `side`/`sideOffset`/`align`/`alignOffset` declared, destructured, forwarded) > Popup. Defaults kept from Radix: Content `side="bottom" align="center" sideOffset=4`; SubContent `side="right" align="start"`, offsets 0. SubContent now portals itself (Radix needed `DropdownMenuPortal` around it).
  - `data-[state=open|closed]:` → `data-open:`/`data-closed:`; SubTrigger `data-[state=open]:` → `data-popup-open:`.
  - `max-h-[var(--radix-dropdown-menu-content-available-height)]` → `max-h-(--available-height)`; `origin-[--radix-dropdown-menu-content-transform-origin]` (v3 syntax, a no-op under Tailwind v4) → `origin-(--transform-origin)`.
  - Label → `GroupLabel`; Sub → `SubmenuRoot`; SubTrigger → `SubmenuTrigger`; ItemIndicator → `CheckboxItemIndicator` / `RadioItemIndicator`.
- Consumers:
  - `apps/web/components/mode-toggle.tsx`: `DropdownMenuTrigger asChild><Button/>` → `render={<Button …/>}`.
  - `apps/admin/components/nav-documents.tsx`: trigger → `render={<SidebarMenuAction …/>}`; `data-[state=open]:bg-accent` → `data-popup-open:bg-accent`.
  - `apps/admin/components/nav-user.tsx`: trigger → `render={<SidebarMenuButton …/>}`; `data-[state=open]:` → `data-popup-open:`; `w-(--radix-dropdown-menu-trigger-width)` → `w-(--anchor-width)`; `DropdownMenuLabel` wrapped in `DropdownMenuGroup` (Base UI throws "MenuGroupContext is missing" for a `GroupLabel` outside a group).
- Leftover scan: clean.

## Left alone

- `SidebarMenuAction`'s internal `showOnHover` styling (`data-[state=open]` inside `sidebar.tsx`) is handled in the sidebar migration.

## Behavior changes

- `CheckboxItem`/`RadioItem` no longer close the menu on click (Base `closeOnClick` defaults to `false` there; Radix closed). No consumers use them.
- Focus loops from last item to first by default (Radix `loop` was `false`).
- `collisionPadding` default 5 (Radix 0).
- `DropdownMenuLabel` gets `aria-hidden` and labels its group via `aria-labelledby` (Radix rendered a plain visible-to-AT div).

## Verify by hand

- Footer theme toggle: opens above the button, aligned to its end; Light/Dark/System switch the theme and close the menu; focus returns to the button.
- Admin sidebar user menu: opens to the right (bottom on mobile), at least trigger width; trigger stays highlighted while open.
- Admin Documents "More" (…) action: menu opens, button stays highlighted while open.
