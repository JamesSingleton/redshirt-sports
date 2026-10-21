import Link from "next/link";
import type { ReactNode } from "react";

import { NAV_FORWARD_TRANSITION } from "@/lib/view-transition-nav";

export function TeamPageLink({
  slug,
  children,
  className,
}: {
  slug?: string | null;
  children: ReactNode;
  className?: string;
}) {
  if (!slug) {
    return children;
  }

  return (
    <Link
      href={`/college/teams/${slug}`}
      className={className ?? "hover:underline"}
      prefetch={true}
      transitionTypes={[...NAV_FORWARD_TRANSITION]}
    >
      {children}
    </Link>
  );
}
