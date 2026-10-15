import { cn } from "@redshirt-sports/ui/lib/utils";
import type * as React from "react";

function HoverCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("group relative inline-flex", className)} {...props} />
  );
}

function HoverCardTrigger({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn("underline-offset-4 hover:underline", className)}
      {...props}
    />
  );
}

function HoverCardContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "invisible absolute top-full left-0 z-20 mt-2 w-64 rounded-lg border border-border bg-popover p-3 text-popover-foreground text-sm shadow-md group-hover:visible group-focus-within:visible",
        className,
      )}
      {...props}
    />
  );
}

export { HoverCard, HoverCardContent, HoverCardTrigger };
