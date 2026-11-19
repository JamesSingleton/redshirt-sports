"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import { PopoverContent as PopoverContentPrimitive } from "@ui-sdk/react/popover";
import type { ComponentProps } from "react";

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: WithClassName<ComponentProps<typeof PopoverContentPrimitive>>) {
  return (
    <PopoverContentPrimitive
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 origin-(--transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none transition-[opacity,scale] duration-150 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverClose,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@ui-sdk/react/popover";

export { PopoverContent };
