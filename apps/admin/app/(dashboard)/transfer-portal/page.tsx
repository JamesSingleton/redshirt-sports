import { Suspense } from "react";

import { getTransferPortalAdminData } from "@/actions/transfer-portal";
import { TransferPortalManager } from "@/components/transfer-portal/transfer-portal-manager";

function TransferPortalFallback() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="bg-muted h-8 w-56 animate-pulse rounded" />
        <div className="bg-muted h-4 w-96 max-w-full animate-pulse rounded" />
      </div>
      <div className="bg-muted h-96 w-full animate-pulse rounded-xl" />
    </div>
  );
}

async function TransferPortalContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const search = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const { players, entries, schools, sports } =
    await getTransferPortalAdminData({ search });

  return (
    <div className="p-6">
      <TransferPortalManager
        players={players}
        entries={entries}
        schools={schools}
        sports={sports}
        search={search}
      />
    </div>
  );
}

export default function TransferPortalAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<TransferPortalFallback />}>
      <TransferPortalContent searchParams={searchParams} />
    </Suspense>
  );
}
