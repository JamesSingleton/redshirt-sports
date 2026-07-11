import type { TransferPortalEntryRow } from "@redshirt-sports/db/queries/transfer-portal";
import Link from "next/link";

import { feedPath } from "@/lib/transfer-portal-feed-params";

function playerName(entry: TransferPortalEntryRow) {
  return entry.displayName ?? `${entry.firstName} ${entry.lastName}`.trim();
}

function PlayerNameLink({ entry }: { entry: TransferPortalEntryRow }) {
  const name = playerName(entry);
  if (!entry.playerSlug) {
    return <span>{name}</span>;
  }
  return (
    <Link
      href={`/player/${entry.playerSlug}`}
      prefetch={false}
      className="hover:underline"
    >
      {name}
    </Link>
  );
}

export function TransferPortalFeedSidebar({
  entries,
  portalYear,
}: {
  entries: TransferPortalEntryRow[];
  portalYear: number;
}) {
  if (entries.length === 0) {
    return null;
  }

  const primarySport = entries[0]?.sportSlug;

  return (
    <aside className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-black tracking-wide uppercase">
        Transfer Portal Feed
      </h2>
      <ul className="mt-4 divide-y divide-border">
        {entries.map((entry) => (
          <li key={entry.entryId} className="py-3 first:pt-0 last:pb-0">
            <p className="text-[11px] font-semibold text-primary uppercase">
              {entry.status}
            </p>
            <p className="mt-1 font-semibold">
              <PlayerNameLink entry={entry} />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {entry.fromSchoolShortName ?? entry.fromSchoolName ?? "—"} →{" "}
              {entry.toSchoolShortName ?? entry.toSchoolName ?? "—"}
            </p>
          </li>
        ))}
      </ul>
      {primarySport ? (
        <Link
          href={feedPath(primarySport, portalYear)}
          className="mt-4 inline-block text-xs font-bold tracking-wide text-primary uppercase hover:underline"
        >
          View all →
        </Link>
      ) : null}
    </aside>
  );
}
