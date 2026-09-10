"use server";

import {
  getCachedVoterBreakdown,
  type RankingsVoterBreakdownProps,
} from "@/components/rankings/rankings-voter-breakdown";
import type { VoterBreakdown } from "@/types/votes";

export async function loadVoterBreakdown(
  props: RankingsVoterBreakdownProps,
): Promise<VoterBreakdown[] | null> {
  return getCachedVoterBreakdown(props);
}
