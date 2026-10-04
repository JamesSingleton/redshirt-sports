# accordion

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/accordion.tsx`: `@radix-ui/react-accordion` → `@base-ui/react/accordion`; Content → `Panel`; types → `.Props`.
  - Chevron rotation `[&[data-state=open]>svg]` → `[&[data-panel-open]>svg]` (Base UI trigger attribute).
  - Added `aria-disabled:` variants next to `disabled:` (Base UI surfaces trigger disabled state as `aria-disabled`).
  - Panel animation: `data-[state=…]:animate-accordion-*` → `h-(--accordion-panel-height) transition-[height] data-starting-style:h-0 data-ending-style:h-0`. tw-animate-css 1.4.0's accordion keyframes don't read `--accordion-panel-height`, so a 1:1 class rename would snap instead of animate.
- No app consumers import this wrapper.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- Consumers must drop `type`/`collapsible`; `value`/`defaultValue` are always arrays and single mode is always collapsible. No current consumers.

## Verify by hand

- None needed (unused in apps). If adopted: open/close animates height smoothly; Enter/Space toggle.
