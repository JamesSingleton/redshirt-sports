import Link from "next/link";
import { Suspense } from "react";

import { getPortalDesk, getSubmissionForEntry } from "@/actions/portal";
import { NewPlayerForm } from "@/components/portal/new-player-form";

function NewPlayerFallback() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="bg-muted h-9 w-64 max-w-full animate-pulse rounded" />
      <div className="bg-muted h-96 w-full animate-pulse rounded-xl" />
    </div>
  );
}

type SearchParams = Promise<{ submission?: string }>;

async function NewPlayerContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { submission: submissionId } = await searchParams;
  const [{ sports }, submission] = await Promise.all([
    getPortalDesk({ pendingOnly: true }),
    submissionId ? getSubmissionForEntry(submissionId) : null,
  ]);
  // Only a waiting, readable submission prefills the form.
  const from =
    submission?.status === "new" && submission.payload
      ? { ...submission, payload: submission.payload }
      : null;
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/portal"
          className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase hover:underline"
        >
          Transfer portal
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Add player</h1>
      </div>
      {from ? (
        <p className="bg-muted/50 rounded-lg border p-3 text-sm">
          From submission #{from.id}: check the details, and pick the school
          from the list if it&apos;s there. Saving marks the submission
          accepted.
          {from.payload.move === "committed" ? (
            <>
              {" "}
              They reported a commitment
              {from.payload.destinationSchool
                ? ` to ${from.payload.destinationSchool}`
                : ""}
              : record it on the player&apos;s page after saving.
            </>
          ) : null}
        </p>
      ) : null}
      <NewPlayerForm
        sports={sports}
        submission={
          from
            ? {
                id: from.id,
                submitterRole: from.submitterRole,
                payload: from.payload,
              }
            : undefined
        }
      />
    </div>
  );
}

export default function NewPlayerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense fallback={<NewPlayerFallback />}>
      <NewPlayerContent searchParams={searchParams} />
    </Suspense>
  );
}
