"use client";

import { buttonVariants } from "@redshirt-sports/ui/components/button";
import { backdropClassName } from "@redshirt-sports/ui/components/dialog";
import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  AlertDialogBackdrop,
  AlertDialogClose as AlertDialogClosePrimitive,
  AlertDialogContent as AlertDialogContentPrimitive,
  AlertDialogDescription as AlertDialogDescriptionPrimitive,
  AlertDialogTitle as AlertDialogTitlePrimitive,
} from "@ui-sdk/react/alert-dialog";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

function AlertDialogContent({
  className,
  ...props
}: WithClassName<ComponentProps<typeof AlertDialogContentPrimitive>>) {
  return (
    <>
      <AlertDialogBackdrop className={backdropClassName} />
      <AlertDialogContentPrimitive
        className={cn(
          "fixed inset-0 z-50 m-auto grid h-fit w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border bg-background p-6 text-foreground shadow-lg outline-none transition-[opacity,scale] duration-200 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 motion-reduce:transition-none sm:max-w-lg",
          className,
        )}
        {...props}
      />
    </>
  );
}

function AlertDialogHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: WithClassName<ComponentProps<typeof AlertDialogTitlePrimitive>>) {
  return (
    <AlertDialogTitlePrimitive
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: WithClassName<ComponentProps<typeof AlertDialogDescriptionPrimitive>>) {
  return (
    <AlertDialogDescriptionPrimitive
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function AlertDialogClose({
  className,
  variant = "outline",
  size,
  ...props
}: WithClassName<ComponentProps<typeof AlertDialogClosePrimitive>> &
  VariantProps<typeof buttonVariants>) {
  return (
    <AlertDialogClosePrimitive
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogTrigger,
  confirm,
} from "@ui-sdk/react/alert-dialog";

export {
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
};
