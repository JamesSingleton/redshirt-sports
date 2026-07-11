import type { TransferPortalEntryRow } from "@redshirt-sports/db/queries/transfer-portal";
import { cn } from "@redshirt-sports/ui/lib/utils";
import Link from "next/link";

const STATUS_STYLES: Record<string, string> = {
  ENTERED: "bg-blue-50 text-blue-700 border-blue-200",
  COMMITTED: "bg-green-50 text-green-700 border-green-200",
  SIGNED: "bg-purple-50 text-purple-700 border-purple-200",
  ENROLLED: "bg-teal-50 text-teal-700 border-teal-200",
  WITHDRAWN: "bg-orange-50 text-orange-700 border-orange-200",
};

function formatHeight(inches: number | null): string {
  if (!inches) return "—";
  const feet = Math.floor(inches / 12);
  const remaining = inches % 12;
  return `${feet}-${remaining}`;
}

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

export function TransferPortalFeedTable({
  entries,
}: {
  entries: TransferPortalEntryRow[];
}) {
  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-muted-foreground">
        No transfer portal activity matches your filters.
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full min-w-[900px] text-sm">
          <caption className="sr-only">Transfer portal activity</caption>
          <thead className="bg-muted/40 text-left text-xs font-bold tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Pos</th>
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">To</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.entryId} className="border-t border-border">
                <td className="px-4 py-3 font-medium">
                  <p>
                    <PlayerNameLink entry={entry} />
                  </p>
                  <div className="text-xs text-muted-foreground">
                    {formatHeight(entry.heightInches)}
                    {entry.weightLbs ? ` · ${entry.weightLbs} lbs` : null}
                  </div>
                </td>
                <td className="px-4 py-3">{entry.position ?? "—"}</td>
                <td className="px-4 py-3">
                  {entry.fromSchoolShortName ?? entry.fromSchoolName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {entry.toSchoolShortName ?? entry.toSchoolName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold",
                      STATUS_STYLES[entry.status] ??
                        "bg-muted text-muted-foreground border-border",
                    )}
                  >
                    {entry.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {entries.map((entry) => (
          <article
            key={entry.entryId}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  <PlayerNameLink entry={entry} />
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.position ?? "—"} · {formatHeight(entry.heightInches)}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                  STATUS_STYLES[entry.status] ??
                    "bg-muted text-muted-foreground border-border",
                )}
              >
                {entry.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {entry.fromSchoolShortName ?? entry.fromSchoolName ?? "—"} →{" "}
              {entry.toSchoolShortName ?? entry.toSchoolName ?? "Undecided"}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
