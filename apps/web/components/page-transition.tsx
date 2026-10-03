import { type ReactNode, ViewTransition } from "react";

const NAV_FORWARD = { "nav-forward": "nav-forward", default: "none" };

/**
 * Page content that slides when a link with the `nav-forward` transition type
 * navigates away from or onto it. Keep this in pages, not layouts: layouts
 * persist across navigations, so their enter/exit never fire.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={NAV_FORWARD} exit={NAV_FORWARD} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
