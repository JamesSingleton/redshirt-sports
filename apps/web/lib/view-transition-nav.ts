/** Hierarchical navigation: list → detail, deeper in the stack. */
export const NAV_FORWARD_TRANSITION = ["nav-forward"] as const;

/** Hierarchical navigation: detail → list, up the stack. */
export const NAV_BACK_TRANSITION = ["nav-back"] as const;

/** Same-level navigation (tabs, year filters) — fade, not slide. */
export const NAV_LATERAL_TRANSITION = ["nav-lateral"] as const;
