"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import { Input } from "@redshirt-sports/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
import { Search } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

import { useDebounce } from "@/hooks/use-debounce";
import { useIsMobile } from "@/hooks/use-is-mobile";
import type { VoterBreakdown } from "@/types/votes";

const VoterBreakdownDesktop = dynamic(() => import("./desktop"), {
  ssr: false,
});
const VoterBreakdownMobile = dynamic(() => import("./mobile"), { ssr: false });

type SortBy = "name" | "match";

type Props = {
  voterBreakdown: VoterBreakdown[];
};

const VOTER_BREAKDOWN_DESCRIPTION =
  "See how each voter cast their ballot for this week's rankings. Match % shows how closely each ballot's rank order matched the final Top 25.";

export default function VoterBallotBreakdown({ voterBreakdown }: Props) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 150);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const isMobile = useIsMobile();
  const [ready, setReady] = useState(false);

  const searchable = useMemo(
    () =>
      voterBreakdown.map((v) => ({
        voter: v,
        text: `${v.name} ${v.organization} ${v.organizationRole || ""}`.toLowerCase(),
      })),
    [voterBreakdown],
  );
  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const list = q
      ? searchable.filter((s) => s.text.includes(q)).map((s) => s.voter)
      : searchable.map((s) => s.voter);

    if (sortBy === "match") {
      return [...list].sort((a, b) => b.matchPercent - a.matchPercent);
    }

    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [debouncedQuery, searchable, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const startIdx = (safePage - 1) * pageSize;
  const rows = useMemo(
    () => filtered.slice(startIdx, startIdx + pageSize),
    [filtered, startIdx, pageSize],
  );

  const pageSizeOptions = useMemo(() => {
    const total = filtered.length;
    const increments = [10, 20, 30, 40, 50, 100];
    // When total exceeds the largest increment, keep all options.
    const maxOption =
      increments.find((n) => n >= total) ?? increments[increments.length - 1]!;
    return increments.filter((n) => n <= maxOption);
  }, [filtered.length]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, pageSize, sortBy]);

  useEffect(() => setReady(true), []);
  if (!ready) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Voter Breakdown</CardTitle>
          <CardDescription>{VOTER_BREAKDOWN_DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Loading view…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-2xl">Voter Breakdown</CardTitle>
          <CardDescription>{VOTER_BREAKDOWN_DESCRIPTION}</CardDescription>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 md:w-auto md:auto-cols-max md:grid-flow-col">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search voters or organizations"
              className="pl-8"
              aria-label="Search voters or organizations"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortBy)}
            >
              <SelectTrigger className="min-w-43.75" aria-label="Sort voters">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="match">Match %</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v))}
            >
              <SelectTrigger className="min-w-43.75">
                <SelectValue placeholder="Rows per page" />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {`${n} per page`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="text-muted-foreground text-sm">
          Showing {rows.length} of {filtered.length} voter(s). Page {safePage}{" "}
          of {pageCount}.
        </div>

        {isMobile ? (
          <VoterBreakdownMobile
            rows={rows}
            page={safePage}
            pageCount={pageCount}
            onPrevAction={() => setPage((p) => Math.max(1, p - 1))}
            onNextAction={() => setPage((p) => Math.min(pageCount, p + 1))}
          />
        ) : (
          <VoterBreakdownDesktop
            rows={rows}
            page={safePage}
            pageCount={pageCount}
            onFirstAction={() => setPage(1)}
            onPrevAction={() => setPage((p) => Math.max(1, p - 1))}
            onNextAction={() => setPage((p) => Math.min(pageCount, p + 1))}
            onLastAction={() => setPage(pageCount)}
          />
        )}
      </CardContent>
    </Card>
  );
}
