import type { ReactNode } from "react";
import { ViewTransition } from "react";

/** Page shell for hierarchical route changes (pairs with Link `transitionTypes`). */
export function DirectionalPageTransition({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ViewTransition
      default="none"
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        "nav-lateral": "nav-lateral-in",
        default: "none",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        "nav-lateral": "nav-lateral-out",
        default: "none",
      }}
    >
      {children}
    </ViewTransition>
  );
}
