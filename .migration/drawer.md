# drawer

2026-10-03, golden pair (shadcn base-nova `drawer` from the registry, per the "Migrating from Vaul" guide) merged with the user's new-york classes; migrated with consumer fixes. Vaul removed.

## Changed

- `packages/ui/src/components/drawer.tsx`: `vaul` → `@base-ui/react/drawer`, using the registry's Base UI structure (Root with a context for `swipeDirection`, `modal`, snap points and the swipe handle; Content → Portal > Backdrop > Viewport > Popup > Content; new `DrawerSwipeHandle` export).
  - The `pnpm dlx shadcn add drawer` run had written the *new-york* (vaul) drawer, because `components.json` still says `"style": "new-york"`. That output was replaced.
  - Kept from the user's drawer: `bg-background` (registry: `bg-popover`), `bg-black/50` overlay (registry: `bg-black/10` + backdrop blur), `rounded-t-lg`/`rounded-b-lg` (registry: `xl`), the 80vh cap on vertical drawers, the `h-2 w-[100px] bg-muted` handle bar with `mt-4` spacing, and the user's header (`p-4`, `md:gap-1.5`), footer (`p-4`), title (`font-semibold`) and description classes. `cn` comes from `@redshirt-sports/ui/lib/utils`, not the `cn` package.
  - `data-[vaul-drawer-direction=*]` → `data-[swipe-direction=*]` / `data-[swipe-axis=*]`; `data-[state=open|closed]` animations → `data-starting-style`/`data-ending-style` transitions.
  - `showSwipeHandle` defaults to `swipeDirection === "down"` (registry default: `false`), which reproduces vaul's handle bar on bottom drawers.
  - `React.useContext` → `React.use`, and the context renders as `<DrawerContext value>` (React 19).
- `packages/ui/src/styles/globals.css`: `body { position: relative; }`, which the shadcn docs require so the iOS Safari overlay covers the viewport after scrolling.
- `packages/ui/package.json` / `pnpm-lock.yaml`: `vaul` removed (no vaul entries left in the lockfile).
- `apps/admin/components/ballot-inbox-voter.tsx`: `<DrawerTrigger asChild>{trigger}</DrawerTrigger>` → `<DrawerTrigger render={<Button size="sm" variant="outline" />}>Manage</DrawerTrigger>` (matching the Dialog branch), and the now-unused `trigger` const was removed.
- `apps/admin/components/__tests__/ballot-inbox-voter.test.tsx`: the `DrawerTrigger` mock now clones `render` like the existing `DialogTrigger` mock.
- Leftover scan: `rg vaul` over apps/packages is empty.

## Left alone

- `components.json` `"style": "new-york"` (all three): still flagged. This is the reason the CLI keeps fetching vaul/Radix components.
- `command.tsx` (cmdk), `sonner.tsx`, `chart.tsx` (recharts): not Radix wrappers.

## Behavior changes

- Swiping uses Base UI's gesture model: the whole popup is swipeable, and the swipe can dismiss it. Vaul's `handleOnly`, `shouldScaleBackground` and `repositionInputs` have no equivalents (the consumer used none of them).
- Nested drawers now stack (parents scale back and stay mounted).
- On iOS Safari the overlay is absolutely positioned; it relies on the new `body { position: relative }`.
- Focus and dismissal follow Base UI dialog semantics (initial focus on the popup, Escape and outside press close it, focus returns to the trigger).

## Verify by hand

- Admin ballot inbox at mobile width: tap "Manage" on a voter. The drawer should slide up from the bottom with the grey handle bar, a 50% black overlay, and a left-aligned header (the consumer passes `text-left`).
- Drag the drawer down to dismiss it, tap the overlay to dismiss it, and check that focus returns to "Manage".
- iOS Safari: scroll the page, open the drawer, and confirm the overlay covers the whole viewport.
- A throwaway render test confirmed the trigger keeps its classes through `render`, the popup is a dialog labelled by its title and description with `data-swipe-direction="down"`, the handle and overlay render, and `DrawerClose` closes it.
