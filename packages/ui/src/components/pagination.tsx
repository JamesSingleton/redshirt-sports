"use client";

import { buttonVariants } from "@redshirt-sports/ui/components/button";
import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  PaginationEllipsis as PaginationEllipsisPrimitive,
  PaginationLink as PaginationLinkPrimitive,
  PaginationList as PaginationListPrimitive,
  PaginationNext as PaginationNextPrimitive,
  PaginationPrevious as PaginationPreviousPrimitive,
  Pagination as PaginationPrimitive,
} from "@ui-sdk/react/pagination";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import type { ComponentProps } from "react";

function Pagination({
  className,
  ...props
}: WithClassName<ComponentProps<typeof PaginationPrimitive>>) {
  return (
    <PaginationPrimitive
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationList({
  className,
  ...props
}: WithClassName<ComponentProps<typeof PaginationListPrimitive>>) {
  return (
    <PaginationListPrimitive
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationLink({
  className,
  ...props
}: WithClassName<ComponentProps<typeof PaginationLinkPrimitive>>) {
  return (
    <PaginationLinkPrimitive
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "data-current:border data-current:bg-background data-current:shadow-xs dark:data-current:border-input dark:data-current:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}

const stepClassName =
  "gap-1 px-2.5 data-disabled:pointer-events-none data-disabled:opacity-50 sm:px-2.5";

function PaginationPrevious({
  className,
  ...props
}: WithClassName<ComponentProps<typeof PaginationPreviousPrimitive>>) {
  return (
    <PaginationPreviousPrimitive
      aria-label="Go to previous page"
      className={cn(
        buttonVariants({ variant: "ghost" }),
        stepClassName,
        "sm:ps-2.5",
        className,
      )}
      {...props}
    >
      <ChevronLeftIcon aria-hidden="true" className="rtl:rotate-180" />
      <span className="hidden sm:block">Previous</span>
    </PaginationPreviousPrimitive>
  );
}

function PaginationNext({
  className,
  ...props
}: WithClassName<ComponentProps<typeof PaginationNextPrimitive>>) {
  return (
    <PaginationNextPrimitive
      aria-label="Go to next page"
      className={cn(
        buttonVariants({ variant: "ghost" }),
        stepClassName,
        "sm:pe-2.5",
        className,
      )}
      {...props}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon aria-hidden="true" className="rtl:rotate-180" />
    </PaginationNextPrimitive>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: WithClassName<ComponentProps<typeof PaginationEllipsisPrimitive>>) {
  return (
    <PaginationEllipsisPrimitive
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon aria-hidden="true" className="size-4" />
      <span className="sr-only">More pages</span>
    </PaginationEllipsisPrimitive>
  );
}

export { PaginationItem } from "@ui-sdk/react/pagination";

export {
  Pagination,
  PaginationEllipsis,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
};
