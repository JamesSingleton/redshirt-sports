import type { ReactNode } from "react";
import { ViewTransition } from "react";

import { articleHeroTransitionName } from "@/lib/view-transition-names";

export function ArticleHeroTransition({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  return (
    <ViewTransition
      name={articleHeroTransitionName(slug)}
      share="morph"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
