import {
  getPollBySportAndSlug,
  isUserAssignedToPoll,
} from "@redshirt-sports/db/queries";

/** True when the user has active credentials and an active assignment on this poll. */
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
  if (!poll) return false;
  return isUserAssignedToPoll({ pollId: poll.id, userId });
}
