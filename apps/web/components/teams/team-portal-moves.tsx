import type { PortalEntry } from "@redshirt-sports/db/queries";
import type { Route } from "next";
import Link from "next/link";

import { SectionHeader } from "@/components/news/section-header";
import { PortalSchool } from "@/components/transfer-portal/portal-school";
import { PortalStatusBadge } from "@/components/transfer-portal/portal-status-badge";
import { playerFullName } from "@/lib/transfer-portal-format";

const MAX_PER_COLUMN = 8;

function MoveList({
  title,
  entries,
  direction,
}: {
  title: string;
  entries: PortalEntry[];
  direction: "incoming" | "outgoing";
}) {
  return (
    <div className="bg-card flex flex-col rounded-md border">
      <h3 className="headline border-b px-4 py-3 text-lg">
        {title}
        <span className="text-muted-foreground ml-2 text-sm font-normal tabular-nums">
          {entries.length}
        </span>
      </h3>
      {entries.length > 0 ? (
        <ul className="divide-y">
          {entries.slice(0, MAX_PER_COLUMN).map((entry) => (
            <li key={entry.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={`/players/${entry.player.slug}` as Route}
                  className="truncate text-sm font-semibold hover:underline"
                >
                  {playerFullName(entry.player)}
                  <span className="text-muted-foreground ml-2 font-normal">
                    {entry.player.position}
                  </span>
                </Link>
                <PortalStatusBadge status={entry.status} />
              </div>
              <PortalSchool
                school={
                  direction === "incoming" ? entry.fromSchool : entry.toSchool
                }
                fallback={
                  entry.status === "WITHDRAWN" ? "Returning" : "Undecided"
                }
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground px-4 py-3 text-sm">None yet.</p>
      )}
    </div>
  );
}

export function TeamPortalMoves({
  teamName,
  incoming,
  outgoing,
}: {
  teamName: string;
  incoming: PortalEntry[];
  outgoing: PortalEntry[];
}) {
  if (incoming.length === 0 && outgoing.length === 0) return null;

  return (
    <section
      aria-labelledby="team-portal-moves"
      className="flex flex-col gap-6"
    >
      <SectionHeader
        id="team-portal-moves"
        title={`${teamName} transfer portal`}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MoveList title="Incoming" entries={incoming} direction="incoming" />
        <MoveList title="Outgoing" entries={outgoing} direction="outgoing" />
      </div>
    </section>
  );
}
