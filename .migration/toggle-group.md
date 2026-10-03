# toggle-group

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/toggle-group.tsx`: Root → callable `@base-ui/react/toggle-group`; items render `@base-ui/react/toggle`; types → `.Props`; `React.useContext` → `React.use`.
- `apps/web/components/teams/teams-directory.tsx:206`: dropped `type="single"`; `value={[sport]}`; `onValueChange` destructures the array.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- None. The handler still ignores deselection, so a sport stays selected.

## Verify by hand

- /college/teams: click each sport; the pressed one highlights and the grid switches; clicking the active one keeps it selected; arrow keys move focus between sports.
