"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  NavigationMenuContent as NavigationMenuContentPrimitive,
  NavigationMenuLink as NavigationMenuLinkPrimitive,
  NavigationMenuList as NavigationMenuListPrimitive,
  NavigationMenu as NavigationMenuPrimitive,
  NavigationMenuTrigger as NavigationMenuTriggerPrimitive,
} from "@ui-sdk/react/navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

const navigationMenuTriggerStyle = cva(
  "group/navigation-menu-trigger inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium outline-none transition-[color,box-shadow] hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-disabled:pointer-events-none data-disabled:opacity-50 data-open:bg-accent/50 data-open:text-accent-foreground data-current:bg-accent/50",
);

function NavigationMenu({
  className,
  ...props
}: WithClassName<ComponentProps<typeof NavigationMenuPrimitive>>) {
  return (
    <NavigationMenuPrimitive
      className={cn(
        "relative flex max-w-max flex-1 items-center justify-center",
        className,
      )}
      {...props}
    />
  );
}

function NavigationMenuList({
  className,
  ...props
}: WithClassName<ComponentProps<typeof NavigationMenuListPrimitive>>) {
  return (
    <NavigationMenuListPrimitive
      className={cn(
        "flex flex-1 list-none items-center justify-center gap-1",
        className,
      )}
      {...props}
    />
  );
}

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: WithClassName<
  Omit<ComponentProps<typeof NavigationMenuTriggerPrimitive>, "children">
> & {
  children?: ReactNode;
}) {
  return (
    <NavigationMenuTriggerPrimitive
      className={cn(navigationMenuTriggerStyle(), className)}
      {...props}
    >
      {children}
      <ChevronDownIcon
        aria-hidden="true"
        className="relative top-px ms-1 size-3 transition duration-300 group-data-open/navigation-menu-trigger:rotate-180"
      />
    </NavigationMenuTriggerPrimitive>
  );
}

function NavigationMenuContent({
  className,
  sideOffset = 6,
  align = "start",
  ...props
}: WithClassName<ComponentProps<typeof NavigationMenuContentPrimitive>>) {
  return (
    <NavigationMenuContentPrimitive
      sideOffset={sideOffset}
      align={align}
      className={cn(
        "z-50 max-h-(--available-height) origin-(--transform-origin) overflow-y-auto rounded-md border bg-popover p-2 text-popover-foreground shadow outline-none transition-[opacity,scale] duration-200 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function NavigationMenuLink({
  className,
  ...props
}: WithClassName<ComponentProps<typeof NavigationMenuLinkPrimitive>>) {
  return (
    <NavigationMenuLinkPrimitive
      className={cn(
        "flex flex-col gap-1 rounded-sm p-2 text-sm outline-none transition-all hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-current:bg-accent/50 data-current:text-accent-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { NavigationMenuItem } from "@ui-sdk/react/navigation-menu";

export {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
};
