"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastRegion,
  ToastTitle,
} from "@ui-sdk/react/toast";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import type { ComponentProps } from "react";

const icons = {
  success: CircleCheckIcon,
  error: CircleAlertIcon,
  info: InfoIcon,
  warning: TriangleAlertIcon,
  loading: LoaderCircleIcon,
} as const;

function Toaster({
  className,
  side = "bottom",
  align = "end",
  ...props
}: WithClassName<Omit<ComponentProps<typeof ToastRegion>, "children">>) {
  return (
    <ToastRegion
      side={side}
      align={align}
      className={cn(
        "fixed z-100 h-(--toast-front-height) w-[min(356px,calc(100vw-2rem))] transition-[height] duration-400 data-expanded:h-[calc(var(--toast-stack-height)+(var(--toast-count)-1)*0.75rem)] data-[align=center]:left-1/2 data-[align=center]:-translate-x-1/2 data-[align=end]:end-4 data-[align=start]:start-4 data-[side=bottom]:bottom-4 data-[side=top]:top-4",
        className,
      )}
      {...props}
    >
      {(toast) => {
        const Icon =
          toast.type in icons ? icons[toast.type as keyof typeof icons] : null;
        return (
          <Toast className="group/toast absolute inset-x-0 bottom-0 z-[calc(100-var(--toast-index))] flex h-(--toast-height) translate-x-(--toast-swipe-x,0px) translate-y-[calc(var(--toast-index)*-0.75rem+var(--toast-swipe-y,0px))] scale-[calc(1-var(--toast-index)*0.05)] items-start gap-3 overflow-hidden rounded-lg border bg-popover p-4 text-sm text-popover-foreground shadow-lg transition-[translate,scale,opacity,height] duration-400 select-none not-data-front:not-data-expanded:h-(--toast-front-height) data-expanded:translate-y-[calc(-1*(var(--toast-offset)+var(--toast-index)*0.75rem)+var(--toast-swipe-y,0px))] data-expanded:scale-100 data-ending-style:opacity-0 data-starting-style:transition-none data-starting-style:data-front:translate-y-full data-starting-style:not-data-front:opacity-0 data-swiping:transition-none motion-reduce:transition-opacity">
            {Icon && (
              <Icon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 group-data-[type=error]/toast:text-destructive group-data-[type=loading]/toast:animate-spin group-data-[type=success]/toast:text-up group-data-[type=warning]/toast:text-gold"
              />
            )}
            <div className="grid min-w-0 flex-1 gap-1">
              <ToastTitle className="font-medium" />
              <ToastDescription className="text-muted-foreground empty:hidden" />
            </div>
            <ToastAction className="h-6 shrink-0 rounded-sm bg-primary px-2 text-xs font-medium text-primary-foreground empty:hidden" />
            <ToastClose
              aria-label="Close"
              className="shrink-0 rounded-xs opacity-0 outline-none transition-opacity group-hover/toast:opacity-70 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <XIcon aria-hidden="true" className="size-4" />
            </ToastClose>
          </Toast>
        );
      }}
    </ToastRegion>
  );
}

export { toast } from "@ui-sdk/react/toast";

export { Toaster };
