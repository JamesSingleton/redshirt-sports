import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import { Separator as SeparatorPrimitive } from "@ui-sdk/react/separator";
import type { ComponentProps } from "react";

function Separator({
  className,
  ...props
}: WithClassName<ComponentProps<typeof SeparatorPrimitive>>) {
  return (
    <SeparatorPrimitive
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
