import {
  getPollBySportAndSlug,
  isUserAssignedToPoll,
} from "@redshirt-sports/db/queries";

/** True when the poll is active and the user has an active assignment. */
export async function userCanVoteOnPoll({
  userId,
  sportId,
  pollSlug,
}: {
  userId: string;
  sportId: string;
  pollSlug: string;
}): Promise<boolean> {
  const poll = await getPollBySportAndSlug({ sportId, slug: pollSlug });
  if (!poll?.isActive) return false;
  return isUserAssignedToPoll({ pollId: poll.id, userId });
}
