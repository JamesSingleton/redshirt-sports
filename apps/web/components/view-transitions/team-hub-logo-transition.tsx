import type { ReactNode } from "react";
import { ViewTransition } from "react";

import { teamHubLogoTransitionName } from "@/lib/view-transition-names";

export function TeamHubLogoTransition({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  return (
    <ViewTransition
      name={teamHubLogoTransitionName(slug)}
      share="morph"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
