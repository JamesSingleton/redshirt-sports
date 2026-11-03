import {
  getSeasonForSport,
  listBracketEditions,
  listCurrentBracketFormats,
  listProjectionWeeks,
} from "@redshirt-sports/db/queries";
import { Badge } from "@redshirt-sports/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@redshirt-sports/ui/components/table";
import Link from "next/link";
import { Suspense } from "react";

import { BracketCreateForm } from "@/components/bracket-create-form";
import {
  bracketEditionName,
  bracketFormatLabel,
  currentFootballSeasonYear,
} from "@/lib/bracket-season";
import { requireAdmin } from "@/lib/require-admin";

async function loadBracketsDesk() {
  await requireAdmin();
  const year = currentFootballSeasonYear();
  const [editions, formats] = await Promise.all([
    listBracketEditions(),
    listCurrentBracketFormats(year),
  ]);
  const football = await Promise.all(
    formats
      .filter((format) => format.sportSlug === "football")
      .map(async (format) => {
        const season = await getSeasonForSport(format.sportId, year);
        return {
          id: format.id,
          label: bracketFormatLabel(format),
          seasonId: season?.id ?? null,
          weeks: season ? await listProjectionWeeks(season.id) : [],
        };
      }),
  );
  return { year, editions, formats: football };
}

function BracketsFallback() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="bg-muted h-9 w-64 max-w-full animate-pulse rounded" />
      <div className="bg-muted h-40 w-full animate-pulse rounded-xl" />
    </div>
  );
}

async function BracketsContent() {
  const { year, editions, formats } = await loadBracketsDesk();
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
          Playoff brackets
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Brackets</h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Weekly projections ("if the playoffs started today") and the
          committee's official bracket. A new projection starts from the field
          you pick to copy. Published brackets update on the site and in every
          article that embeds them.
        </p>
      </div>

      <BracketCreateForm
        year={year}
        formats={formats}
        editions={editions
          .filter((edition) => edition.year === year)
          .map((edition) => ({
            id: edition.id,
            formatId: edition.formatId,
            kind: edition.kind,
            weekNumber: edition.weekNumber,
          }))}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Season</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Bracket</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {editions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground">
                No brackets yet.
              </TableCell>
            </TableRow>
          ) : (
            editions.map((edition) => (
              <TableRow key={edition.id}>
                <TableCell>{edition.year}</TableCell>
                <TableCell>{bracketFormatLabel(edition)}</TableCell>
                <TableCell>
                  <Link
                    href={`/brackets/${edition.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {bracketEditionName(edition)}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      edition.status === "published" ? "default" : "secondary"
                    }
                  >
                    {edition.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {edition.updatedAt?.toLocaleString("en-US", {
                    timeZone: "America/New_York",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function BracketsPage() {
  return (
    <Suspense fallback={<BracketsFallback />}>
      <BracketsContent />
    </Suspense>
  );
}
