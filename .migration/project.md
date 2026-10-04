# project

2026-10-03, whole-project migration of `packages/ui/src/components` from Radix to Base UI (`@base-ui/react` 1.8.0), one commit per wrapper on `feature/migrate-radix-to-base-ui`. Verdict: done; 0 wrappers remain on Radix.

## Wrappers migrated (26)

button, alert-dialog, label, separator, badge, breadcrumb, item, avatar, toggle, toggle-group, switch, checkbox, accordion, collapsible, tabs, scroll-area, popover, tooltip, dialog, sheet, dropdown-menu, select, navigation-menu, form, sidebar, drawer (vaul → Base UI Drawer, done afterwards at your request). Each has its own `.migration/<component>.md`.

Commit order caveat: the `button` commit (1be5e47) doesn't typecheck on its own, because `alert-dialog` still used the Radix-era button API until the next commit (e3477c1). Squash or bisect them as a pair.

## Dependency swap

- Removed from `packages/ui/package.json`: `radix-ui` and all 13 direct `@radix-ui/react-*` packages (accordion, avatar, collapsible, dialog, dropdown-menu, label, navigation-menu, popover, scroll-area, select, separator, slot, tooltip).
- `vaul` removed with the drawer migration.
- `@base-ui/react` ^1.8.0 is the only primitive library left.
- `pnpm-lock.yaml` shrank by about 1,250 lines. The `@radix-ui/*` entries still in the lockfile (react-dialog, react-slot, react-portal, focus-scope, and so on) are transitive dependencies of **cmdk** (command), which this migration deliberately leaves alone.

## Left alone (not Radix wrappers, out of scope by rule)

- `command.tsx` (cmdk), `sonner.tsx` (sonner), `chart.tsx` (recharts).
- `table.tsx` `data-[state=selected]`: an attribute consumers set themselves, not Radix.
- `sidebar.tsx` `data-state="expanded|collapsed"`: set by the sidebar itself.
- **`components.json` switched from `"style": "new-york"` to `"base-nova"`** in `packages/ui`, `apps/web` and `apps/admin`, at your request. `shadcn info` now reports base `base`, style `nova`, so future `shadcn add` runs fetch Base UI components. They arrive in nova's look (for example `bg-popover`, `rounded-xl`, lighter overlays), not new-york's, and existing components are unchanged.

## App-code sweep

- No file in `apps/` or `packages/` imports Radix (`rg "radix"` over `*.ts`/`*.tsx` is empty).
- `asChild` → `render` converted in every consumer of a migrated wrapper across `apps/web` and `apps/admin`. Each component's report lists its consumers. No `asChild` is left anywhere.
- Radix-only props: none remain. Every `onSelect` left belongs to cmdk's `CommandItem`. `onCheckedChange` on Switch/Checkbox has the same shape in Base UI.
- `data-[state=open]` consumer classes on triggers → `data-popup-open` (dropdown, nav-user, nav-documents, sidebar action and button).
- Select consumers gained `items` maps (so triggers show labels, not raw values) and `value !== null` guards for Base UI's `onValueChange(value | null)`.
- `--radix-*` CSS variables: none left.

## Behavior changes worth your attention (details in each report)

- **navigation-menu: the menu stays open after you click a link** (Base UI `Link` defaults to `closeOnClick={false}`). Verified in the browser. The one-prop fix in `primary-nav.tsx` isn't applied.
- navigation-menu: one shared popup morphs between items; hover delay is 50ms (was 200ms).
- Menus: CheckboxItem/RadioItem don't close the menu on click; keyboard focus loops.
- Select: `""` counts as no value (shows the placeholder); the popup is a popper under the trigger (`alignItemWithTrigger={false}`).

## Final build result

- Typecheck: `packages/ui`, `apps/web` and `apps/admin` are clean.
- Tests: web 773/773, admin 21/21, ui 24/24, the same counts as before the migration. Web's coverage-threshold failure (when run with coverage) predates this work.
- `pnpm turbo run build --filter=./apps/web --filter=./apps/admin`: 2/2 successful (2m44s). The only log noise is the existing "fetching the tweet failed … during prerendering" warning on `/[slug]`, which is handled and unrelated.
