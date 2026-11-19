"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import { CollapsiblePanel as CollapsiblePanelPrimitive } from "@ui-sdk/react/collapsible";
import type { ComponentProps } from "react";

function CollapsiblePanel({
  className,
  ...props
}: WithClassName<ComponentProps<typeof CollapsiblePanelPrimitive>>) {
  return (
    <CollapsiblePanelPrimitive
      className={cn(
        "h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-starting-style:h-0 data-ending-style:h-0 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

export { Collapsible, CollapsibleTrigger } from "@ui-sdk/react/collapsible";

export { CollapsiblePanel };
