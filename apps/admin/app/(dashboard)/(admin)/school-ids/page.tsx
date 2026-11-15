import { Suspense } from "react";

import { getSchoolIdReview } from "@/actions/school-ids";
import { SchoolIdsDesk } from "@/components/school-ids-desk";

function SchoolIdsFallback() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="bg-muted h-9 w-64 max-w-full animate-pulse rounded" />
      <div className="bg-muted h-80 w-full animate-pulse rounded-xl" />
    </div>
  );
}

async function SchoolIdsContent() {
  const review = await getSchoolIdReview();
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
          Data providers
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Team IDs</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Schools with no team id, with suggested matches from the provider's
          football (every division) and Division I basketball team lists.
          Confirm a suggestion, or paste a team id from the provider's team page
          URL. Existing ids are never changed here. For lower-division
          basketball-only schools, run <code>pnpm team-ids --full</code> from{" "}
          <code>packages/db</code>.
        </p>
      </div>
      <SchoolIdsDesk review={review} />
    </div>
  );
}

export default function SchoolIdsPage() {
  return (
    <Suspense fallback={<SchoolIdsFallback />}>
      <SchoolIdsContent />
    </Suspense>
  );
}
