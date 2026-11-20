"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  MenuContent as MenuContentPrimitive,
  MenuGroupLabel as MenuGroupLabelPrimitive,
  MenuItemIndicator,
  MenuItem as MenuItemPrimitive,
  MenuRadioItem as MenuRadioItemPrimitive,
  MenuSeparator as MenuSeparatorPrimitive,
} from "@ui-sdk/react/menu";
import { CheckIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

function MenuContent({
  className,
  sideOffset = 4,
  ...props
}: WithClassName<ComponentProps<typeof MenuContentPrimitive>>) {
  return (
    <MenuContentPrimitive
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-h-(--available-height) min-w-[8rem] origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none transition-[opacity,scale] duration-100 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function MenuItem({
  className,
  inset,
  destructive,
  ...props
}: WithClassName<ComponentProps<typeof MenuItemPrimitive>> & {
  inset?: boolean;
}) {
  return (
    <MenuItemPrimitive
      destructive={destructive}
      data-inset={inset ? "" : undefined}
      data-variant={destructive ? "destructive" : undefined}
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 data-inset:ps-8 data-[variant=destructive]:text-destructive data-[variant=destructive]:data-highlighted:bg-destructive/10 dark:data-[variant=destructive]:data-highlighted:bg-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground data-[variant=destructive]:*:[svg]:text-destructive!",
        className,
      )}
      {...props}
    />
  );
}

function MenuGroupLabel({
  className,
  inset,
  ...props
}: WithClassName<ComponentProps<typeof MenuGroupLabelPrimitive>> & {
  inset?: boolean;
}) {
  return (
    <MenuGroupLabelPrimitive
      data-inset={inset ? "" : undefined}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-inset:ps-8",
        className,
      )}
      {...props}
    />
  );
}

function MenuSeparator({
  className,
  ...props
}: WithClassName<ComponentProps<typeof MenuSeparatorPrimitive>>) {
  return (
    <MenuSeparatorPrimitive
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

/** One choice in a `MenuRadioGroup`, with a check when it's the group's value. */
function MenuRadioItem({
  className,
  children,
  ...props
}: WithClassName<
  Omit<ComponentProps<typeof MenuRadioItemPrimitive>, "children">
> & { children?: ReactNode }) {
  return (
    <MenuRadioItemPrimitive
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-sm py-1.5 ps-8 pe-2 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute start-2 flex size-3.5 items-center justify-center">
        <MenuItemIndicator>
          <CheckIcon className="size-4" />
        </MenuItemIndicator>
      </span>
      {children}
    </MenuRadioItemPrimitive>
  );
}

export {
  Menu,
  MenuGroup,
  MenuRadioGroup,
  MenuTrigger,
} from "@ui-sdk/react/menu";

export { MenuContent, MenuGroupLabel, MenuItem, MenuRadioItem, MenuSeparator };
