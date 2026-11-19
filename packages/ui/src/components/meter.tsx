"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  MeterIndicator as MeterIndicatorPrimitive,
  MeterTrack as MeterTrackPrimitive,
} from "@ui-sdk/react/meter";
import type { ComponentProps } from "react";

function MeterTrack({
  className,
  children,
  ...props
}: WithClassName<ComponentProps<typeof MeterTrackPrimitive>>) {
  return (
    <MeterTrackPrimitive
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
      {...props}
    >
      {children ?? <MeterIndicator />}
    </MeterTrackPrimitive>
  );
}

function MeterIndicator({
  className,
  ...props
}: WithClassName<ComponentProps<typeof MeterIndicatorPrimitive>>) {
  return (
    <MeterIndicatorPrimitive
      className={cn(
        "h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

export { Meter, MeterLabel, MeterValue } from "@ui-sdk/react/meter";

export { MeterIndicator, MeterTrack };
