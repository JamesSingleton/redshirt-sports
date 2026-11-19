"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import { HoverCardContent as HoverCardContentPrimitive } from "@ui-sdk/react/hover-card";
import type { ComponentProps } from "react";

function HoverCardContent({
  className,
  sideOffset = 6,
  ...props
}: WithClassName<ComponentProps<typeof HoverCardContentPrimitive>>) {
  return (
    <HoverCardContentPrimitive
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 origin-(--transform-origin) rounded-lg border bg-popover p-4 text-popover-foreground shadow-md outline-none transition-[opacity,scale] duration-150 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

export { HoverCard, HoverCardTrigger } from "@ui-sdk/react/hover-card";

export { HoverCardContent };
