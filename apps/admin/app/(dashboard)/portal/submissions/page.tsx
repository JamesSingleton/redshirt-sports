import Link from "next/link";
import { Suspense } from "react";

import { getSubmissionInbox } from "@/actions/portal";
import { SubmissionInboxList } from "@/components/portal/submission-inbox";

type SearchParams = Promise<{ status?: string; before?: string }>;

function InboxFallback() {
  return (
    <div className="flex flex-col gap-6 p-6" aria-busy>
      <div className="bg-muted h-9 w-64 max-w-full animate-pulse rounded" />
      <div className="bg-muted h-80 w-full animate-pulse rounded-xl" />
    </div>
  );
}

async function InboxContent({ searchParams }: { searchParams: SearchParams }) {
  const { status, before } = await searchParams;
  const inbox = await getSubmissionInbox({ status, beforeId: before });
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/portal"
          className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase hover:underline"
        >
          Transfer portal
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Submissions</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Moves reported through the public form. Check each one, then add the
          player or record the move yourself: nothing here reaches the site on
          its own.
        </p>
      </div>
      <SubmissionInboxList inbox={inbox} />
    </div>
  );
}

export default function SubmissionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<InboxFallback />}>
      <InboxContent searchParams={searchParams} />
    </Suspense>
  );
}
