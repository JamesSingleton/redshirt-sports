"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import { TooltipContent as TooltipContentPrimitive } from "@ui-sdk/react/tooltip";
import type { ComponentProps } from "react";

function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: WithClassName<ComponentProps<typeof TooltipContentPrimitive>>) {
  return (
    <TooltipContentPrimitive
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-fit origin-(--transform-origin) rounded-md bg-primary px-3 py-1.5 text-xs text-balance text-primary-foreground transition-[opacity,scale] duration-100 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 data-instant:transition-none",
        className,
      )}
      {...props}
    />
  );
}

export { Tooltip, TooltipTrigger } from "@ui-sdk/react/tooltip";

export { TooltipContent };
