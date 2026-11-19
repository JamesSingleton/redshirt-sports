import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import { Label as LabelPrimitive } from "@ui-sdk/react/label";
import type { ComponentProps } from "react";

function Label({
  className,
  ...props
}: WithClassName<ComponentProps<typeof LabelPrimitive>>) {
  return (
    <LabelPrimitive
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-disabled:pointer-events-none group-data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
