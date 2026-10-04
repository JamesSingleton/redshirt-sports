"use client";

import { Tabs, TabsContent } from "@redshirt-sports/ui/components/tabs";
import {
  type ComponentProps,
  startTransition,
  useState,
  ViewTransition,
} from "react";

/** Tabs whose panel swap runs in a transition so the panels can cross-fade. */
export function TransitionTabs({
  defaultValue,
  ...props
}: Omit<ComponentProps<typeof Tabs>, "value" | "onValueChange"> & {
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <Tabs
      {...props}
      value={value}
      onValueChange={(next) => startTransition(() => setValue(next))}
    />
  );
}

export function TransitionTabsPanel({
  value,
  children,
  ...props
}: ComponentProps<typeof TabsContent> & { value: string }) {
  return (
    <TabsContent value={value} {...props}>
      <ViewTransition
        key={value}
        enter="fade-in"
        exit="fade-out"
        default="none"
      >
        <div>{children}</div>
      </ViewTransition>
    </TabsContent>
  );
}
