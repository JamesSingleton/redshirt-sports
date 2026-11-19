"use client";

import { cn, type WithClassName } from "@redshirt-sports/ui/lib/utils";
import {
  CheckboxIndicator,
  Checkbox as CheckboxPrimitive,
} from "@ui-sdk/react/checkbox";
import { CheckIcon, MinusIcon } from "lucide-react";
import type { ComponentProps } from "react";

function Checkbox({
  className,
  ...props
}: WithClassName<ComponentProps<typeof CheckboxPrimitive>>) {
  return (
    <CheckboxPrimitive
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-input shadow-xs outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-indeterminate:border-primary data-indeterminate:bg-primary data-indeterminate:text-primary-foreground data-disabled:cursor-not-allowed data-disabled:opacity-50 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 dark:data-checked:bg-primary",
        className,
      )}
      {...props}
    >
      <CheckboxIndicator className="grid place-content-center text-current">
        {(state) =>
          state.indeterminate ? (
            <MinusIcon aria-hidden="true" className="size-3.5" />
          ) : (
            <CheckIcon aria-hidden="true" className="size-3.5" />
          )
        }
      </CheckboxIndicator>
    </CheckboxPrimitive>
  );
}

export { Checkbox };
