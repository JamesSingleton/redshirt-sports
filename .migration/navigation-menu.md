# navigation-menu

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated with consumer fixes and one flagged behavior change.

## Changed

- `packages/ui/src/components/navigation-menu.tsx`: `@radix-ui/react-navigation-menu` → `@base-ui/react/navigation-menu`; types → `NavigationMenuPrimitive.*.Props`.
  - Root: the `viewport` boolean prop is gone. Base UI has no inline-content mode; every menu renders into one shared popup. Root always renders `NavigationMenuPositioner` and takes an `align` prop (default `"start"`, matching where the old `viewport={false}` content sat).
  - New `NavigationMenuPositioner` replaces `NavigationMenuViewport`: Portal > Positioner (`isolate z-50`, side `bottom`, `sideOffset` 6 standing in for the old `mt-1.5`, align `start`, sized by `--positioner-width/height`, capped at `--available-width`) > Popup (`data-slot="navigation-menu-viewport"`, the old viewport classes with `data-[state=…]` → `data-open`/`data-closed`, sized by `--popup-width/height`, `origin-(--transform-origin)`) > Viewport.
  - Trigger style: `data-[state=open]:` → `data-popup-open:`; chevron `group-data-[state=open]:rotate-180` → `group-data-popup-open:rotate-180`. The header tone's `data-active:` classes stay as-is.
  - Content: `data-[motion=from-|to-*]` slide animations → `data-[activation-direction=left|right]` combined with `data-starting-style`/`data-ending-style` translate and opacity transitions. Dropped the `top-0 left-0 w-full md:absolute` positioning, because the Positioner now places the content.
  - Link: `data-[active=true]:` classes kept. They didn't match under Radix either (Radix sets `data-active=""`), so leaving them preserves the current look.
  - Indicator → `NavigationMenuPrimitive.Icon` (Base UI has no indicator part). Its classes are kept. No consumer uses it.
- `apps/web/components/site-header/primary-nav.tsx`: removed `viewport={false}`; both `NavigationMenuLink asChild` + `<NavAnchor>` children → `render={<NavAnchor link={…} />}` with the text and description moved into the Link.

## Left alone

- `NavigationMenuTrigger tone="header" data-active=…` in primary-nav: the `data-active` attribute is set by the consumer, not by Radix, so it still drives the active styling.
- The mobile nav (`mobile-nav.tsx`) uses Sheet/Accordion, not this component.

## Behavior changes

- **The menu stays open after you click a link.** Radix closed the menu on select. Base UI's `NavigationMenu.Link` defaults to `closeOnClick={false}`. Verified in the browser: clicking Football → FBS goes to `/college/football/news/fbs`, but the Football dropdown stays open over the new page. A one-prop fix in `primary-nav.tsx` (`closeOnClick` on each `NavigationMenuLink`) would restore the old behavior. I haven't applied it.
- One shared popup now morphs between items (its width and height animate) instead of each item showing its own content under its trigger. The popup is anchored to whichever trigger is active.
- Hover open delay: Base UI defaults to 50ms; Radix used 200ms. Menus open faster on hover and are easier to open by accident.
- The `NavigationMenuViewport` export was renamed to `NavigationMenuPositioner`. Nothing in the repo imported it.
- `NavigationMenuIndicator` no longer draws an arrow that follows the active trigger. It's an inert icon slot. Unused.

## Verify by hand

- Desktop header (≥ md): hover and click Football, Men's Basketball, Rankings and About. The popup should appear 6px below the trigger with matching left edges (measured: trigger x=932, popup x=932, y = trigger bottom + 6), and it should resize smoothly when you move between triggers.
- Click a menu link and decide whether the menu should close (see Behavior changes).
- The Shop link still opens in a new tab (`target="_blank"`), and the active route's link gets `data-active`.
- Keyboard: Tab to a trigger, press Enter or Arrow Down to open, arrow through the links, and press Escape to close and return focus to the trigger.
