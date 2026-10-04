import { type ReactNode, Suspense, ViewTransition } from "react";

/**
 * Suspense boundary whose skeleton slides out and content slides in. Reveals
 * run in their own transition without navigation types, so the props are
 * plain strings rather than type maps.
 */
export function SuspenseReveal({
  fallback,
  children,
}: {
  fallback: ReactNode;
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={<ViewTransition exit="slide-down">{fallback}</ViewTransition>}
    >
      <ViewTransition enter="slide-up" default="none">
        {children}
      </ViewTransition>
    </Suspense>
  );
}
