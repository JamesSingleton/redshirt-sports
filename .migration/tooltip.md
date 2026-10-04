# tooltip

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/tooltip.tsx`: Radix → `@base-ui/react/tooltip`.
  - `TooltipProvider` `delayDuration = 0` → `delay = 0`. Each `Tooltip` still wraps itself in a provider, as before.
  - Content → Portal > Positioner (`isolate z-50`; `side`/`sideOffset`/`align`/`alignOffset` forwarded) > Popup; `data-[state=closed]:` → `data-closed:`; entry animation scoped to `data-open:`; `--radix-tooltip-content-transform-origin` → `--transform-origin`.
  - Arrow: same rotated square, plus per-side placement classes from the base registry (Base UI positions the arrow element but doesn't offset it like Radix's SVG).
  - Default `sideOffset` 0 → 4: Radix silently added the 5px arrow height to the offset; Base UI does not.
- Consumers:
  - `apps/web/components/rankings/voter-ballot-breakdown/match-badge.tsx`: `TooltipTrigger asChild` → `render={<button …/>}`.
  - `packages/ui/src/components/sidebar.tsx`: `TooltipProvider delayDuration` → `delay`; `TooltipTrigger asChild` → `render={button}`.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- Base UI tooltips close when the trigger is clicked (`closeOnClick` defaults to true).

## Verify by hand

- Rankings voter breakdown: hover/focus "Match %": tooltip shows above with the arrow centered under it.
- Admin sidebar collapsed: hover icons; tooltips appear to the right.
