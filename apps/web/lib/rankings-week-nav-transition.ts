import { parseWeekSegment } from "@redshirt-sports/clients/espn";

import {
  NAV_BACK_TRANSITION,
  NAV_FORWARD_TRANSITION,
  NAV_LATERAL_TRANSITION,
} from "@/lib/view-transition-nav";

export function rankingsWeekNavTransitionTypes(
  weekSlug: string | undefined,
  segment: string,
): readonly string[] {
  if (!weekSlug) {
    return NAV_LATERAL_TRANSITION;
  }

  try {
    const nextWeek = parseWeekSegment(segment);
    const currentWeek = parseWeekSegment(weekSlug);
    if (nextWeek === currentWeek) {
      return NAV_LATERAL_TRANSITION;
    }
    return nextWeek > currentWeek
      ? NAV_FORWARD_TRANSITION
      : NAV_BACK_TRANSITION;
  } catch {
    return NAV_LATERAL_TRANSITION;
  }
}
