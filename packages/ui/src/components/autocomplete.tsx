"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  AutocompleteClear as AutocompleteClearPrimitive,
  AutocompleteContent as AutocompleteContentPrimitive,
  AutocompleteEmpty as AutocompleteEmptyPrimitive,
  AutocompleteInput as AutocompleteInputPrimitive,
  AutocompleteItem as AutocompleteItemPrimitive,
  AutocompleteList as AutocompleteListPrimitive,
  AutocompleteStatus as AutocompleteStatusPrimitive,
} from "@ui-sdk/react/autocomplete";
import { XIcon } from "lucide-react";
import type { ComponentProps } from "react";

function AutocompleteInput({
  className,
  ...props
}: WithClassName<ComponentProps<typeof AutocompleteInputPrimitive>>) {
  return (
    <AutocompleteInputPrimitive
      className={cn(
        "border-input dark:bg-input/30 h-9 w-full min-w-0 rounded-md border bg-transparent px-3 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-disabled:cursor-not-allowed data-disabled:opacity-50 md:text-sm [&::-webkit-search-cancel-button]:appearance-none",
        className,
      )}
      {...props}
    />
  );
}

function AutocompleteClear({
  className,
  ...props
}: WithClassName<
  Omit<ComponentProps<typeof AutocompleteClearPrimitive>, "children">
>) {
  return (
    <AutocompleteClearPrimitive
      aria-label="Clear"
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground",
        className,
      )}
      {...props}
    >
      <XIcon aria-hidden="true" className="size-3.5" />
    </AutocompleteClearPrimitive>
  );
}

function AutocompleteContent({
  className,
  sideOffset = 4,
  align = "start",
  ...props
}: WithClassName<ComponentProps<typeof AutocompleteContentPrimitive>>) {
  return (
    <AutocompleteContentPrimitive
      sideOffset={sideOffset}
      align={align}
      className={cn(
        "z-50 flex max-h-[min(30rem,var(--available-height))] min-w-(--anchor-width) origin-(--transform-origin) flex-col overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg outline-none transition-[opacity,scale] duration-100 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function AutocompleteList({
  className,
  ...props
}: WithClassName<ComponentProps<typeof AutocompleteListPrimitive>>) {
  return (
    <AutocompleteListPrimitive
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain p-1 empty:hidden",
        className,
      )}
      {...props}
    />
  );
}

function AutocompleteItem({
  className,
  ...props
}: WithClassName<ComponentProps<typeof AutocompleteItemPrimitive>>) {
  return (
    <AutocompleteItemPrimitive
      className={cn(
        "flex w-full cursor-default items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function AutocompleteEmpty({
  className,
  ...props
}: WithClassName<ComponentProps<typeof AutocompleteEmptyPrimitive>>) {
  return (
    <AutocompleteEmptyPrimitive
      className={cn(
        "px-4 py-6 text-center text-sm text-muted-foreground empty:hidden",
        className,
      )}
      {...props}
    />
  );
}

function AutocompleteStatus({
  className,
  ...props
}: WithClassName<ComponentProps<typeof AutocompleteStatusPrimitive>>) {
  return (
    <AutocompleteStatusPrimitive
      className={cn(
        "px-3 py-2 text-xs text-muted-foreground empty:hidden",
        className,
      )}
      {...props}
    />
  );
}

export { useAsyncOptions } from "@ui-sdk/react/async-options";
export {
  Autocomplete,
  AutocompleteGroup,
  AutocompleteLabel,
} from "@ui-sdk/react/autocomplete";

export {
  AutocompleteClear,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteStatus,
};
