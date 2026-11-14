import { Suspense } from "react";

import { getBallotPolls } from "@/actions/ballots";
import { BallotAudit } from "@/components/ballot-audit";

function BallotsFallback() {
  return (
    <div className="flex flex-col gap-6 p-6" aria-busy>
      <div className="bg-muted h-9 w-48 animate-pulse rounded" />
      <div className="bg-muted h-80 w-full animate-pulse rounded-xl" />
    </div>
  );
}

async function BallotsContent() {
  const polls = await getBallotPolls();
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
          Top 25
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Ballots</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Every voter&apos;s ballot for the week, including before rankings are
          published. Read-only: if something looks wrong, tell the voter so they
          can fix their own ballot.
        </p>
      </div>
      <BallotAudit polls={polls} />
    </div>
  );
}

export default function BallotsPage() {
  return (
    <Suspense fallback={<BallotsFallback />}>
      <BallotsContent />
    </Suspense>
  );
}
