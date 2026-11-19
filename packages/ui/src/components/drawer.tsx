"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  DrawerBackdrop,
  DrawerClose,
  DrawerContent as DrawerContentPrimitive,
  DrawerDescription as DrawerDescriptionPrimitive,
  DrawerTitle as DrawerTitlePrimitive,
} from "@ui-sdk/react/drawer";
import { XIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

function DrawerContent({
  className,
  children,
  showCloseButton = false,
  ...props
}: WithClassName<
  Omit<ComponentProps<typeof DrawerContentPrimitive>, "children">
> & {
  children?: ReactNode;
  showCloseButton?: boolean;
}) {
  return (
    <>
      <DrawerBackdrop className="fixed inset-0 z-50 bg-black/50" />
      <DrawerContentPrimitive
        className={cn(
          "group/drawer-content relative flex flex-col gap-4 bg-background text-foreground shadow-lg outline-none",
          "data-[side=bottom]:max-h-[80dvh] data-[side=bottom]:rounded-t-lg data-[side=bottom]:border-t data-[side=top]:max-h-[80dvh] data-[side=top]:rounded-b-lg data-[side=top]:border-b",
          "data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l sm:data-[side=left]:max-w-sm sm:data-[side=right]:max-w-sm",
          className,
        )}
        {...props}
      >
        <div
          aria-hidden="true"
          className="mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full bg-muted group-data-[side=bottom]/drawer-content:block"
        />
        {children}
        {showCloseButton && (
          <DrawerClose
            aria-label="Close"
            className="absolute top-4 right-4 rounded-xs opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <XIcon aria-hidden="true" className="size-4" />
          </DrawerClose>
        )}
      </DrawerContentPrimitive>
    </>
  );
}

function DrawerHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-1.5 p-4 group-data-[side=bottom]/drawer-content:text-center group-data-[side=top]/drawer-content:text-center md:text-left",
        className,
      )}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function DrawerTitle({
  className,
  ...props
}: WithClassName<ComponentProps<typeof DrawerTitlePrimitive>>) {
  return (
    <DrawerTitlePrimitive
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: WithClassName<ComponentProps<typeof DrawerDescriptionPrimitive>>) {
  return (
    <DrawerDescriptionPrimitive
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Drawer, DrawerClose, DrawerTrigger } from "@ui-sdk/react/drawer";

export {
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
};
