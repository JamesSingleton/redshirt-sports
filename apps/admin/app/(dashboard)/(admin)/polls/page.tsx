import { Suspense } from "react";

import { getPollsManagerData } from "@/actions/polls";
import { PollsManager } from "@/components/polls-manager";

function PollsFallback() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="bg-muted h-9 w-48 animate-pulse rounded" />
      <div className="bg-muted h-64 w-full animate-pulse rounded-xl" />
    </div>
  );
}

async function PollsContent() {
  const { polls, sports } = await getPollsManagerData();

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
          Top 25
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Polls</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Create and activate Top 25 panels (FBS, FCS, D2, D3, basketball
          scopes). Slug is the vote URL segment.
        </p>
      </div>
      <PollsManager polls={polls} sports={sports} />
    </div>
  );
}

export default function PollsPage() {
  return (
    <Suspense fallback={<PollsFallback />}>
      <PollsContent />
    </Suspense>
  );
}
