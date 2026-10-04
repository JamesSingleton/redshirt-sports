# sidebar

2026-10-03, hand port (no Base UI primitive; Slot → useRender), migrated with consumer fixes.

## Changed

- `packages/ui/src/components/sidebar.tsx`: `@radix-ui/react-slot` removed. The five `asChild` parts (`SidebarGroupLabel`, `SidebarGroupAction`, `SidebarMenuButton`, `SidebarMenuAction`, `SidebarMenuSubButton`) now call `useRender` + `mergeProps` with a `render` prop (types `useRender.ComponentProps<"div" | "button" | "a">`). The data-attribute object literals are cast, per the mergeProps pitfall.
  - `data-slot`, `data-sidebar`, `data-size` and `data-active={isActive}` are still set explicitly (not through useRender's `state`). `data-active` therefore still renders `"true"`/`"false"`, and the existing `data-[active=true]:` and `peer-data-[active=true]/menu-button:` classes keep working.
  - `SidebarMenuButton`: the tooltip path still wraps the rendered element in `<TooltipTrigger render={button} />`.
  - Menu button open styling: `data-[state=open]:hover:…` → `data-popup-open:hover:…` (dropdown trigger) plus `data-panel-open:hover:…` (collapsible trigger), the two attributes Base UI triggers set in place of Radix's `data-state="open"`.
  - `SidebarMenuAction showOnHover`: `data-[state=open]:opacity-100` → `data-popup-open:opacity-100`, so the action stays visible while its dropdown is open.
- Admin consumers: `SidebarMenuButton asChild` + `<Link>`/`<a>` child → `render={<Link … />}` / `render={<a … />}` with the icon and label moved into the button, in `app-sidebar.tsx`, `nav-main.tsx`, `nav-secondary.tsx` and `nav-documents.tsx`.

## Left alone

- `SidebarProvider`, `Sidebar`, `SidebarTrigger`, `SidebarRail`, `SidebarInset` and the other plain-element parts: no Radix in them. The mobile Sheet and the Tooltip they use were migrated in their own commits.
- `data-state={state}` (expanded/collapsed) on the sidebar root and the `peer-data-[state=collapsed]` / `[data-state=collapsed]` classes: the sidebar sets that attribute itself, not Radix.
- `md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2` and the `hsl(var(--sidebar-border))` shadows: user classes, unchanged.

## Behavior changes

- None expected. `mergeProps` gives the rendered element's own props precedence and chains handlers, as Slot did.
- A collapsible trigger wrapping `SidebarMenuButton` now gets the open hover style through `data-panel-open`, and a dropdown trigger through `data-popup-open`. No consumer in the repo currently wraps a menu button in a Collapsible.

## Verify by hand

- Admin sidebar (desktop): the logo link and each nav item navigate; the active route's item is highlighted; collapse to icon mode (if enabled) and hover an item to see its tooltip on the right.
- Documents group: hover a row so the "…" action appears, open its menu, and check that the action stays visible and highlighted while the menu is open.
- Footer user menu (`nav-user.tsx`): the trigger button shows its open styling while the menu is open.
- Mobile width: the sidebar opens as a Sheet and the links close it.
- A throwaway render test confirmed: `render={<a/>}` with a tooltip produces a link with `href`, `data-active="true"`, `data-size`, `data-slot` and merged classes; the default renders a `<button>` with `data-active="false"`; `SidebarMenuAction` works as a `DropdownMenuTrigger` render target (`aria-haspopup="menu"`).
