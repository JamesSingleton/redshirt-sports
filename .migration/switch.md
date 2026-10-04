# switch

2026-10-03, engine (legacy `new-york` style; user classes kept), migrated cleanly.

## Changed

- `packages/ui/src/components/switch.tsx`: Radix → `@base-ui/react/switch`; `data-[state=checked|unchecked]:` → `data-checked:`/`data-unchecked:` on Root and Thumb; `disabled:` → `data-disabled:` (Root is now a `<span>`).
- Consumers checked (`checked`/`onCheckedChange` stay compatible): admin `polls-manager.tsx`, `voting-panels.tsx`, `transfer-portal/player-form-dialog.tsx`.
- Leftover scan: clean.

## Left alone

- None.

## Behavior changes

- `onCheckedChange` now receives `(checked, eventDetails)`; existing single-arg handlers are unaffected.
- See label: `peer-disabled:` labels no longer react to a disabled switch.

## Verify by hand

- Admin → Polls and Voting panels: toggle switches by click and Space; thumb slides; disabled switches look dimmed.
- Transfer portal player form: switch value is submitted with the form.
