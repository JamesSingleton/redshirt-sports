import Link from "next/link";
import { Suspense } from "react";

import { getPortalDesk } from "@/actions/portal";
import { NewPlayerForm } from "@/components/portal/new-player-form";

function NewPlayerFallback() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="bg-muted h-9 w-64 max-w-full animate-pulse rounded" />
      <div className="bg-muted h-96 w-full animate-pulse rounded-xl" />
    </div>
  );
}

async function NewPlayerContent() {
  const { sports } = await getPortalDesk({ pendingOnly: true });
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
      <NewPlayerForm sports={sports} />
    </div>
  );
}

export default function NewPlayerPage() {
  return (
    <Suspense fallback={<NewPlayerFallback />}>
      <NewPlayerContent />
    </Suspense>
  );
}
