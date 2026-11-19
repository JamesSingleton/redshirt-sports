"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  AccordionHeader,
  AccordionItem as AccordionItemPrimitive,
  AccordionPanel as AccordionPanelPrimitive,
  AccordionTrigger as AccordionTriggerPrimitive,
} from "@ui-sdk/react/accordion";
import { ChevronDownIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

function AccordionItem({
  className,
  ...props
}: WithClassName<ComponentProps<typeof AccordionItemPrimitive>>) {
  return (
    <AccordionItemPrimitive
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: WithClassName<
  Omit<ComponentProps<typeof AccordionTriggerPrimitive>, "children">
> & {
  children?: ReactNode;
}) {
  return (
    <AccordionHeader className="flex">
      <AccordionTriggerPrimitive
        className={cn(
          "group/accordion-trigger flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium outline-none transition-all hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-disabled:pointer-events-none data-disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          aria-hidden="true"
          className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200 group-data-open/accordion-trigger:rotate-180"
        />
      </AccordionTriggerPrimitive>
    </AccordionHeader>
  );
}

function AccordionPanel({
  className,
  children,
  ...props
}: WithClassName<
  Omit<ComponentProps<typeof AccordionPanelPrimitive>, "children">
> & {
  children?: ReactNode;
}) {
  return (
    <AccordionPanelPrimitive
      className="h-(--accordion-panel-height) overflow-hidden text-sm transition-[height] duration-200 ease-out data-starting-style:h-0 data-ending-style:h-0 motion-reduce:transition-none"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPanelPrimitive>
  );
}

export { Accordion } from "@ui-sdk/react/accordion";

export { AccordionItem, AccordionPanel, AccordionTrigger };
