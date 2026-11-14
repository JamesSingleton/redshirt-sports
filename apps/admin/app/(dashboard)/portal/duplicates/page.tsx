import Link from "next/link";
import { Suspense } from "react";

import { getDuplicateQueue } from "@/actions/portal";
import { DuplicateQueueList } from "@/components/portal/duplicates";

function DuplicatesFallback() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="bg-muted h-9 w-64 max-w-full animate-pulse rounded" />
      <div className="bg-muted h-80 w-full animate-pulse rounded-xl" />
    </div>
  );
}

async function DuplicatesContent() {
  const queue = await getDuplicateQueue();
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/portal"
          className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase hover:underline"
        >
          Transfer portal
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          Possible duplicates
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Players added in the last 90 days whose names look like another
          player's, who share a sport, and who also share a school, hometown, or
          high school class. Nothing here is certain: compare them, then merge
          or mark them as different people.
        </p>
      </div>
      <DuplicateQueueList queue={queue} />
    </div>
  );
}

export default function DuplicatesPage() {
  return (
    <Suspense fallback={<DuplicatesFallback />}>
      <DuplicatesContent />
    </Suspense>
  );
}
