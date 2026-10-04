# form

2026-10-03, hand port (no Base UI primitive; Slot → useRender), migrated with no consumer changes.

## Changed

- `packages/ui/src/components/form.tsx`: `FormControl` was a bare `@radix-ui/react-slot` `Slot`. It now calls `useRender` with its single child element as `render`, and `mergeProps` combines `data-slot`, `id`, `aria-describedby` and `aria-invalid` with any props passed in (the object literal is cast because of the `data-*` excess-property issue).
  - The props type is now `HTMLAttributes<HTMLElement>` plus a required single `children: ReactElement` (Slot's type allowed any children; a non-element child never worked at runtime anyway).
- `FormLabel` props type: `React.ComponentProps<typeof LabelPrimitive.Root>` → `React.ComponentProps<typeof Label>` (the Radix label type import is gone; `Label` was already migrated).

## Left alone

- `Form`, `FormField`, `FormItem`, `FormDescription`, `FormMessage`, `useFormField`: no Radix in them.
- Consumers `apps/web/components/forms/onboarding.tsx` and `top-25.tsx`: still `<FormControl><Child/></FormControl>`, so nothing changes.

## Behavior changes

- None expected. Base UI clones the child with `mergeProps(formControlProps, child.props)`, which matches Slot: handlers chain, `className` concatenates, and the child's own value wins when both set the same prop. A throwaway test confirmed that the label targets the input, the child keeps its own classes, and `aria-invalid`/`aria-describedby` update when there's an error.

## Verify by hand

- Onboarding (`/onboarding`): submit empty and confirm each field gets a red label and message and the input has `aria-invalid="true"`; a screen reader should announce the description and error.
- Vote ballot (`/vote/college/…`): the `VirtualizedCombobox` inside `FormControl` still gets `id`/`aria-*` on its trigger, and clicking the label focuses it.
