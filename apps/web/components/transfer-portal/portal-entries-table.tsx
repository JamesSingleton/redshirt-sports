import type { PortalEntry } from "@redshirt-sports/db/queries";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@redshirt-sports/ui/components/table";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { PortalSchool } from "@/components/transfer-portal/portal-school";
import { PortalStatusBadge } from "@/components/transfer-portal/portal-status-badge";
import {
  formatAcademicYearShort,
  formatHeight,
  formatPortalDate,
  playerFullName,
} from "@/lib/transfer-portal-format";

/** Pass one or more `PortalEntryRows` bodies as children. */
export function PortalEntriesTable({
  caption,
  children,
}: {
  caption: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-card overflow-hidden rounded-md border">
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Player</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Updated</TableHead>
          </TableRow>
        </TableHeader>
        {children}
      </Table>
    </div>
  );
}

export function PortalEntryRow({ entry }: { entry: PortalEntry }) {
  const { player } = entry;
  const details = [
    player.position,
    formatAcademicYearShort(player.academicYear, player.isRedshirt),
    formatHeight(player.heightInches),
    player.weightLbs ? `${player.weightLbs}` : null,
  ].filter(Boolean);

  return (
    <TableRow>
      <TableCell className="pl-4">
        <div className="flex min-w-40 flex-col gap-0.5">
          <Link
            href={`/players/${player.slug}` as Route}
            className="font-semibold hover:underline"
          >
            {playerFullName(player)}
          </Link>
          <span className="text-muted-foreground flex gap-2 text-xs">
            {details.map((detail) => (
              <span key={detail}>{detail}</span>
            ))}
          </span>
        </div>
      </TableCell>
      <TableCell className="max-w-48">
        <PortalSchool school={entry.fromSchool} />
      </TableCell>
      <TableCell className="max-w-48">
        <PortalSchool
          school={entry.toSchool}
          fallback={entry.status === "WITHDRAWN" ? "Returning" : "Undecided"}
        />
      </TableCell>
      <TableCell>
        <PortalStatusBadge status={entry.status} />
      </TableCell>
      <TableCell className="text-muted-foreground pr-4 text-right text-xs tabular-nums">
        <time dateTime={new Date(entry.eventDate).toISOString()}>
          {formatPortalDate(entry.eventDate)}
        </time>
      </TableCell>
    </TableRow>
  );
}
