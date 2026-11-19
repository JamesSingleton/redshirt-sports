import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  AvatarFallback as AvatarFallbackPrimitive,
  AvatarImage as AvatarImagePrimitive,
  Avatar as AvatarPrimitive,
} from "@ui-sdk/react/avatar";
import type { ComponentProps } from "react";

function Avatar({
  className,
  ...props
}: WithClassName<ComponentProps<typeof AvatarPrimitive>>) {
  return (
    <AvatarPrimitive
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: WithClassName<ComponentProps<typeof AvatarImagePrimitive>>) {
  return (
    <AvatarImagePrimitive
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: WithClassName<ComponentProps<typeof AvatarFallbackPrimitive>>) {
  return (
    <AvatarFallbackPrimitive
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback, AvatarImage };
