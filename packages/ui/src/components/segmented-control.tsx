"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  SegmentedControlIndicator,
  SegmentedControlItem as SegmentedControlItemPrimitive,
  SegmentedControl as SegmentedControlPrimitive,
} from "@ui-sdk/react/segmented-control";
import type { ComponentProps, ReactNode } from "react";

function SegmentedControl({
  className,
  children,
  ...props
}: WithClassName<
  Omit<ComponentProps<typeof SegmentedControlPrimitive>, "children">
> & { children?: ReactNode }) {
  return (
    <SegmentedControlPrimitive
      className={cn(
        "relative isolate inline-flex h-9 w-fit items-center rounded-lg bg-muted p-[3px] text-muted-foreground data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SegmentedControlIndicator className="absolute top-(--segmented-control-indicator-top) left-(--segmented-control-indicator-left) -z-10 h-(--segmented-control-indicator-height) w-(--segmented-control-indicator-width) rounded-md bg-background shadow-sm transition-[top,left,width,height] duration-200 motion-reduce:transition-none dark:border dark:border-input dark:bg-input/30" />
      {children}
    </SegmentedControlPrimitive>
  );
}

function SegmentedControlItem({
  className,
  ...props
}: WithClassName<ComponentProps<typeof SegmentedControlItemPrimitive>>) {
  return (
    <SegmentedControlItemPrimitive
      className={cn(
        "inline-flex h-full flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm font-medium outline-none transition-colors select-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-checked:text-foreground data-disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export { SegmentedControl, SegmentedControlItem };
