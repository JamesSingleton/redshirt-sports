"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  TabsList as TabsListPrimitive,
  TabsPanel as TabsPanelPrimitive,
  Tabs as TabsPrimitive,
  TabsTab as TabsTabPrimitive,
} from "@ui-sdk/react/tabs";
import type { ComponentProps } from "react";

function Tabs({
  className,
  ...props
}: WithClassName<ComponentProps<typeof TabsPrimitive>>) {
  return (
    <TabsPrimitive
      className={cn(
        "flex gap-2 data-[orientation=horizontal]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

function TabsList({
  className,
  variant = "default",
  ...props
}: WithClassName<ComponentProps<typeof TabsListPrimitive>> & {
  variant?: "default" | "line";
}) {
  return (
    <TabsListPrimitive
      data-variant={variant}
      className={cn(
        "group/tabs-list inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground data-[orientation=vertical]:h-auto data-[orientation=vertical]:flex-col data-[variant=default]:bg-muted data-[variant=line]:gap-1 data-[variant=line]:rounded-none",
        className,
      )}
      {...props}
    />
  );
}

function TabsTab({
  className,
  ...props
}: WithClassName<ComponentProps<typeof TabsTabPrimitive>>) {
  return (
    <TabsTabPrimitive
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 py-1 text-sm font-medium text-foreground/60 outline-none transition-[color,box-shadow] select-none hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-disabled:pointer-events-none data-disabled:opacity-50 data-selected:text-foreground dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=default]/tabs-list:data-selected:bg-background group-data-[variant=default]/tabs-list:data-selected:shadow-sm dark:group-data-[variant=default]/tabs-list:data-selected:border-input dark:group-data-[variant=default]/tabs-list:data-selected:bg-input/30",
        "after:absolute after:inset-x-0 after:-bottom-[5px] after:h-0.5 after:bg-foreground after:opacity-0 after:transition-opacity group-data-[variant=line]/tabs-list:data-selected:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function TabsPanel({
  className,
  ...props
}: WithClassName<ComponentProps<typeof TabsPanelPrimitive>>) {
  return (
    <TabsPanelPrimitive
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsPanel, TabsTab };
