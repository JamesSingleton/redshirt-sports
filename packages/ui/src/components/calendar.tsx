"use client";

import { buttonVariants } from "@redshirt-sports/ui/components/button";
import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  CalendarDay,
  CalendarGrid,
  CalendarHeading,
  CalendarNext,
  CalendarPrevious,
  Calendar as CalendarPrimitive,
  CalendarWeekday,
  CalendarWeekdays,
  CalendarWeeks,
} from "@ui-sdk/react/calendar";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { ComponentProps } from "react";

const navClassName = cn(
  buttonVariants({ variant: "ghost", size: "icon" }),
  "size-8 data-disabled:opacity-50",
);

function Calendar({
  className,
  ...props
}: WithClassName<Omit<ComponentProps<typeof CalendarPrimitive>, "children">>) {
  return (
    <CalendarPrimitive
      className={cn(
        "grid w-fit grid-cols-[auto_1fr_auto] items-center gap-y-3 p-3",
        className,
      )}
      {...props}
    >
      <CalendarPrevious aria-label="Previous month" className={navClassName}>
        <ChevronLeftIcon aria-hidden="true" className="rtl:rotate-180" />
      </CalendarPrevious>
      <CalendarHeading className="text-center text-sm font-medium" />
      <CalendarNext aria-label="Next month" className={navClassName}>
        <ChevronRightIcon aria-hidden="true" className="rtl:rotate-180" />
      </CalendarNext>
      <CalendarGrid className="col-span-3 border-collapse">
        <CalendarWeekdays>
          {(index) => (
            <CalendarWeekday
              index={index}
              className="w-8 pb-1 text-[0.8rem] font-normal text-muted-foreground"
            />
          )}
        </CalendarWeekdays>
        <CalendarWeeks>
          {(cell) => (
            <CalendarDay
              value={cell.date}
              className="size-8 rounded-md p-0 text-center text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 data-disabled:pointer-events-none data-disabled:opacity-50 data-outside:text-muted-foreground data-selected:bg-primary data-selected:text-primary-foreground data-today:not-data-selected:bg-accent data-today:not-data-selected:text-accent-foreground data-unavailable:line-through"
            />
          )}
        </CalendarWeeks>
      </CalendarGrid>
    </CalendarPrimitive>
  );
}

export { Calendar };
