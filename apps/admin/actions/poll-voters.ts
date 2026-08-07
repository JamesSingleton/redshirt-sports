"use server";

import { clerkClient } from "@redshirt-sports/auth/server";
import {
  assignVoterToPoll,
  listActivePollVoters,
  listPolls,
  listUsers,
  revokeAssignmentsForNonVoters,
  revokeVoterFromPoll,
  setUserIsVoter,
} from "@redshirt-sports/db/queries";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { requireAdmin } from "@/lib/require-admin";

export async function getVotersPageData() {
  await requireAdmin();

  after(() => {
    void revokeAssignmentsForNonVoters();
  });

  const [polls, users] = await Promise.all([listPolls(), listUsers()]);
  const assignments = await Promise.all(
    polls.map(async (poll) => ({
      pollId: poll.id,
      userIds: (await listActivePollVoters(poll.id)).map((a) => a.userId),
    })),
  );

  return {
    polls: polls.map((poll) => ({
      id: poll.id,
      name: poll.name,
      slug: poll.slug,
      sportSlug: poll.sport?.slug ?? "",
    })),
    users: users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      organization: user.organization,
      isVoter: user.isVoter,
    })),
    assignmentsByPollId: Object.fromEntries(
      assignments.map((a) => [a.pollId, a.userIds]),
    ) as Record<string, string[]>,
  };
}

export async function setVoterCredential({
  userId,
  isVoter,
}: {
  userId: string;
  isVoter: boolean;
}) {
  await requireAdmin();
  if (!userId) throw new Error("userId is required");

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { isVoter },
  });
  await setUserIsVoter({ userId, isVoter });
  revalidatePath("/voters");
}

export async function setPollAssignment({
  pollId,
  userId,
  assigned,
}: {
  pollId: string;
  userId: string;
  assigned: boolean;
}) {
  await requireAdmin();
  if (!pollId || !userId) {
    throw new Error("pollId and userId are required");
  }

  if (assigned) {
    await assignVoterToPoll({ pollId, userId });
  } else {
    await revokeVoterFromPoll({ pollId, userId });
  }
  revalidatePath("/voters");
}
