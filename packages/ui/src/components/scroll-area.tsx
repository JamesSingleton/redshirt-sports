"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  ScrollArea as ScrollAreaPrimitive,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@ui-sdk/react/scroll-area";
import type { ComponentProps } from "react";

function ScrollArea({
  className,
  children,
  ...props
}: WithClassName<ComponentProps<typeof ScrollAreaPrimitive>>) {
  return (
    <ScrollAreaPrimitive className={cn("relative", className)} {...props}>
      <ScrollAreaViewport className="size-full rounded-[inherit] outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1">
        {children}
      </ScrollAreaViewport>
      <ScrollBar />
    </ScrollAreaPrimitive>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: WithClassName<ComponentProps<typeof ScrollAreaScrollbar>>) {
  return (
    <ScrollAreaScrollbar
      orientation={orientation}
      className={cn(
        "flex touch-none p-px opacity-0 transition-opacity select-none data-visible:opacity-100 data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-col data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2.5",
        className,
      )}
      {...props}
    >
      <ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
    </ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };
