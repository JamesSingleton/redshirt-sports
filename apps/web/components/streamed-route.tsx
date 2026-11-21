import type { ReactNode } from "react";

/**
 * For routes whose content streams in after a placeholder (rankings,
 * playoffs, ratings, search, the portal, people). Holding a screen's height
 * keeps the footer below the fold until the content lands, so it never
 * paints in view and then moves. Short static pages leave it off, so their
 * footer shows. `e2e/layout-shift.instant.spec.ts` says which need it.
 */
export function StreamedRoute({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh">{children}</div>;
}

/** The same, as a route segment layout. */
export default function StreamedRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <StreamedRoute>{children}</StreamedRoute>;
}
