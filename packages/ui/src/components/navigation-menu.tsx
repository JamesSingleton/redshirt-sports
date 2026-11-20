"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  NavigationMenuContent as NavigationMenuContentPrimitive,
  NavigationMenuLink as NavigationMenuLinkPrimitive,
  NavigationMenuList as NavigationMenuListPrimitive,
  NavigationMenu as NavigationMenuPrimitive,
  NavigationMenuTrigger as NavigationMenuTriggerPrimitive,
  NavigationMenuViewport as NavigationMenuViewportPrimitive,
} from "@ui-sdk/react/navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

const navigationMenuTriggerStyle = cva(
  "group/navigation-menu-trigger inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium outline-none transition-[color,box-shadow] hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-disabled:pointer-events-none data-disabled:opacity-50 data-open:bg-accent/50 data-open:text-accent-foreground data-current:bg-accent/50",
);

/**
 * Renders a shared viewport by default, so one popup holds whichever panel is
 * open. Without it each panel is its own popup, and ui-sdk returns focus to
 * the old trigger when hover switches items, which leaves that trigger
 * focus-visible (ring and highlight) after the pointer has moved on.
 */
function NavigationMenu({
  className,
  children,
  viewport = true,
  ...props
}: WithClassName<
  Omit<ComponentProps<typeof NavigationMenuPrimitive>, "children">
> & {
  children?: ReactNode;
  viewport?: boolean;
}) {
  return (
    <NavigationMenuPrimitive
      className={cn(
        "relative flex max-w-max flex-1 items-center justify-center",
        className,
      )}
      {...props}
    >
      {children}
      {viewport ? <NavigationMenuViewport /> : null}
    </NavigationMenuPrimitive>
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

/** Content sits at the viewport's corner with its own width; the viewport takes its size. */
function NavigationMenuContent({
  className,
  ...props
}: WithClassName<ComponentProps<typeof NavigationMenuContentPrimitive>>) {
  return (
    <NavigationMenuContentPrimitive
      className={cn(
        "absolute start-0 top-0 max-h-(--panel-height) w-max overflow-y-auto p-2 outline-none transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

/** The popup that holds the open panel, below its trigger and following it between items. */
function NavigationMenuViewport({
  className,
  sideOffset = 6,
  align = "start",
  ...props
}: WithClassName<ComponentProps<typeof NavigationMenuViewportPrimitive>>) {
  return (
    <NavigationMenuViewportPrimitive
      sideOffset={sideOffset}
      align={align}
      className={cn(
        "z-50 h-(--viewport-height) w-(--viewport-width) origin-(--transform-origin) overflow-hidden rounded-md border bg-popover text-popover-foreground shadow outline-none [--panel-height:var(--available-height)] transition-[width,height,left,top,opacity,scale] duration-200 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 motion-reduce:transition-none",
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
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
};
