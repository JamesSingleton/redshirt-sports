"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  ComboboxChip as ComboboxChipPrimitive,
  ComboboxChipRemove as ComboboxChipRemovePrimitive,
  ComboboxChips as ComboboxChipsPrimitive,
  ComboboxContent as ComboboxContentPrimitive,
  ComboboxEmpty as ComboboxEmptyPrimitive,
  ComboboxGroupLabel as ComboboxGroupLabelPrimitive,
  ComboboxInput as ComboboxInputPrimitive,
  ComboboxItemIndicator,
  ComboboxItem as ComboboxItemPrimitive,
  ComboboxLabel as ComboboxLabelPrimitive,
  ComboboxList as ComboboxListPrimitive,
  ComboboxSeparator as ComboboxSeparatorPrimitive,
  ComboboxTrigger as ComboboxTriggerPrimitive,
} from "@ui-sdk/react/combobox";
import { CheckIcon, SearchIcon, XIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

const fieldClassName =
  "border-input dark:bg-input/30 flex h-9 w-full min-w-0 items-center gap-2 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-disabled:cursor-not-allowed data-disabled:opacity-50";

function ComboboxLabel({
  className,
  ...props
}: WithClassName<ComponentProps<typeof ComboboxLabelPrimitive>>) {
  return (
    <ComboboxLabelPrimitive
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxInput({
  className,
  ...props
}: WithClassName<ComponentProps<typeof ComboboxInputPrimitive>>) {
  return (
    <ComboboxInputPrimitive
      className={cn(
        fieldClassName,
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** The search field at the top of a popup opened by a {@link ComboboxTrigger}. */
function ComboboxSearch({
  className,
  ...props
}: WithClassName<ComponentProps<typeof ComboboxInputPrimitive>>) {
  return (
    <div className="flex h-9 items-center gap-2 border-b px-3">
      <SearchIcon aria-hidden="true" className="size-4 shrink-0 opacity-50" />
      <ComboboxInputPrimitive
        className={cn(
          "flex h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function ComboboxTrigger({
  className,
  ...props
}: WithClassName<ComponentProps<typeof ComboboxTriggerPrimitive>>) {
  return (
    <ComboboxTriggerPrimitive
      className={cn(
        fieldClassName,
        "justify-between text-start hover:bg-accent dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxContent({
  className,
  sideOffset = 4,
  align = "start",
  ...props
}: WithClassName<ComponentProps<typeof ComboboxContentPrimitive>>) {
  return (
    <ComboboxContentPrimitive
      sideOffset={sideOffset}
      align={align}
      className={cn(
        "z-50 flex max-h-[min(24rem,var(--available-height))] min-w-(--anchor-width) origin-(--transform-origin) flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md outline-none transition-[opacity,scale] duration-100 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 motion-reduce:transition-none",
        "data-[presentation=sheet]:h-[85dvh] data-[presentation=sheet]:max-h-none data-[presentation=sheet]:w-full data-[presentation=sheet]:rounded-b-none data-[presentation=sheet]:rounded-t-xl data-[presentation=sheet]:scale-100",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxList({
  className,
  ...props
}: WithClassName<ComponentProps<typeof ComboboxListPrimitive>>) {
  return (
    <ComboboxListPrimitive
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain p-1 empty:hidden",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  indicator = true,
  ...props
}: WithClassName<
  Omit<ComponentProps<typeof ComboboxItemPrimitive>, "children">
> & {
  children?: ReactNode;
  /** Shows a check on the selected item. */
  indicator?: boolean;
}) {
  return (
    <ComboboxItemPrimitive
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        indicator && "pe-8",
        className,
      )}
      {...props}
    >
      {children}
      {indicator ? (
        <ComboboxItemIndicator className="absolute end-2 flex size-4 items-center justify-center">
          <CheckIcon aria-hidden="true" />
        </ComboboxItemIndicator>
      ) : null}
    </ComboboxItemPrimitive>
  );
}

function ComboboxEmpty({
  className,
  ...props
}: WithClassName<ComponentProps<typeof ComboboxEmptyPrimitive>>) {
  return (
    <ComboboxEmptyPrimitive
      className={cn(
        "py-6 text-center text-sm text-muted-foreground not-data-empty:hidden",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxGroupLabel({
  className,
  ...props
}: WithClassName<ComponentProps<typeof ComboboxGroupLabelPrimitive>>) {
  return (
    <ComboboxGroupLabelPrimitive
      className={cn(
        "px-2 py-1.5 text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxSeparator({
  className,
  ...props
}: WithClassName<ComponentProps<typeof ComboboxSeparatorPrimitive>>) {
  return (
    <ComboboxSeparatorPrimitive
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function ComboboxChips({
  className,
  ...props
}: WithClassName<ComponentProps<typeof ComboboxChipsPrimitive>>) {
  return (
    <ComboboxChipsPrimitive
      className={cn(
        fieldClassName,
        "h-auto min-h-9 flex-wrap gap-1 px-1 py-0.5 [&_[data-slot=combobox-input]]:h-7.5 [&_[data-slot=combobox-input]]:min-w-16 [&_[data-slot=combobox-input]]:flex-1 [&_[data-slot=combobox-input]]:border-0 [&_[data-slot=combobox-input]]:bg-transparent [&_[data-slot=combobox-input]]:px-1.5 [&_[data-slot=combobox-input]]:shadow-none [&_[data-slot=combobox-input]]:ring-0",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChip({
  className,
  ...props
}: WithClassName<ComponentProps<typeof ComboboxChipPrimitive>>) {
  return (
    <ComboboxChipPrimitive
      className={cn(
        "inline-flex h-6 max-w-full min-w-0 items-center gap-1 rounded-sm bg-secondary ps-2 text-xs font-medium text-secondary-foreground outline-none data-highlighted:ring-2 data-highlighted:ring-ring/50",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChipRemove({
  className,
  ...props
}: WithClassName<
  Omit<ComponentProps<typeof ComboboxChipRemovePrimitive>, "children">
>) {
  return (
    <ComboboxChipRemovePrimitive
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    >
      <XIcon aria-hidden="true" className="size-3" />
    </ComboboxChipRemovePrimitive>
  );
}

export {
  Combobox,
  ComboboxGroup,
  ComboboxValue,
} from "@ui-sdk/react/combobox";

export {
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSearch,
  ComboboxSeparator,
  ComboboxTrigger,
};
