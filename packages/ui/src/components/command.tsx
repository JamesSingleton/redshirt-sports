"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  CommandEmpty as CommandEmptyPrimitive,
  CommandGroupLabel as CommandGroupLabelPrimitive,
  CommandInput as CommandInputPrimitive,
  CommandItem as CommandItemPrimitive,
  CommandList as CommandListPrimitive,
  Command as CommandPrimitive,
  CommandSeparator as CommandSeparatorPrimitive,
} from "@ui-sdk/react/command";
import { SearchIcon } from "lucide-react";
import type { ComponentProps } from "react";

function Command({
  className,
  ...props
}: WithClassName<ComponentProps<typeof CommandPrimitive>>) {
  return (
    <CommandPrimitive
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandInput({
  className,
  ...props
}: WithClassName<ComponentProps<typeof CommandInputPrimitive>>) {
  return (
    <div className="flex h-9 items-center gap-2 border-b px-3">
      <SearchIcon aria-hidden="true" className="size-4 shrink-0 opacity-50" />
      <CommandInputPrimitive
        className={cn(
          "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({
  className,
  ...props
}: WithClassName<ComponentProps<typeof CommandListPrimitive>>) {
  return (
    <CommandListPrimitive
      className={cn(
        "max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto p-1 transition-opacity aria-busy:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty({
  className,
  ...props
}: WithClassName<ComponentProps<typeof CommandEmptyPrimitive>>) {
  return (
    <CommandEmptyPrimitive
      className={cn("py-6 text-center text-sm empty:hidden", className)}
      {...props}
    />
  );
}

function CommandGroupLabel({
  className,
  ...props
}: WithClassName<ComponentProps<typeof CommandGroupLabelPrimitive>>) {
  return (
    <CommandGroupLabelPrimitive
      className={cn(
        "px-2 py-1.5 text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandItem({
  className,
  ...props
}: WithClassName<ComponentProps<typeof CommandItemPrimitive>>) {
  return (
    <CommandItemPrimitive
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: WithClassName<ComponentProps<typeof CommandSeparatorPrimitive>>) {
  return (
    <CommandSeparatorPrimitive
      className={cn("-mx-1 h-px bg-border", className)}
      {...props}
    />
  );
}

export { CommandGroup } from "@ui-sdk/react/command";

export {
  Command,
  CommandEmpty,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
};
