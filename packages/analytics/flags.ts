import "server-only";

import { analytics } from "./server";

/**
 * PostHog feature flag keys. A flag here is a kill switch: on runs the new
 * code, off runs the code it replaced. Delete the key, and the old code, once
 * the new code has proven itself.
 */
export const FLAGS = {
  /** The Top 25 ballot editor (reorder, eligible-teams panel). Off: the per-rank dropdown ballot. */
  top25BallotEditor: "top25-ballot-editor",
} as const;

export type FlagKey = (typeof FLAGS)[keyof typeof FLAGS];

/**
 * Whether `flag` is on for `distinctId` (the Clerk user id, which is also the
 * PostHog distinct id). Returns `fallback` when PostHog isn't configured, is
 * unreachable, or doesn't know the flag, so an outage never takes a page down.
 */
export async function isFlagEnabled(
  flag: FlagKey,
  distinctId: string,
  fallback: boolean,
): Promise<boolean> {
  if (!analytics) return fallback;
  try {
    const flags = await analytics.evaluateFlags(distinctId, {
      flagKeys: [flag],
    });
    return flags.isEnabled(flag, { defaultValue: fallback });
  } catch {
    return fallback;
  }
}
