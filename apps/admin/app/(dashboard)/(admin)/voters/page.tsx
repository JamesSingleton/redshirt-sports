import { Suspense } from "react";

import { getVotersPageData } from "@/actions/poll-voters";
import { VotingPanels } from "@/components/voting-panels";

function VotersFallback() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="bg-muted h-3 w-24 animate-pulse rounded" />
        <div className="bg-muted h-9 w-56 animate-pulse rounded" />
        <div className="bg-muted h-4 w-96 max-w-full animate-pulse rounded" />
      </div>
      <div className="bg-muted h-[32rem] w-full animate-pulse rounded-xl" />
    </div>
  );
}

async function VotersContent() {
  const { polls, users, assignmentsByPollId } = await getVotersPageData();

  return (
    <div className="p-6">
      <VotingPanels
        polls={polls}
        users={users}
        assignmentsByPollId={assignmentsByPollId}
      />
    </div>
  );
}

export default function VotersPage() {
  return (
    <Suspense fallback={<VotersFallback />}>
      <VotersContent />
    </Suspense>
  );
}
