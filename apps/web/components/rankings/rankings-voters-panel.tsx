"use client";

import { Avatar, AvatarFallback } from "@redshirt-sports/ui/components/avatar";
import { Button } from "@redshirt-sports/ui/components/button";
import { Input } from "@redshirt-sports/ui/components/input";
import { Search, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export type VotersPanelRow = {
  id: string;
  name: string;
  organization: string;
  organizationRole: string;
  voterSinceLabel: string;
  ballotsSubmittedLabel: string;
  totalBallotsLabel: string;
  latestBallotHref: string;
};

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border bg-card p-3 sm:p-4">
      <div className="text-sm uppercase tracking-wide text-muted-foreground sm:text-sm">
        {label}
      </div>
      <div className="font-display text-2xl font-extrabold tabular sm:text-3xl">
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{detail}</div>
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return name.slice(0, 2).toUpperCase();
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

export function RankingsVotersPanel({
  voters,
  seasonYear,
  divisionName,
  ballotsSubmittedLabel,
  outletCount,
  methodologyHref,
}: {
  voters: VotersPanelRow[];
  seasonYear: number;
  divisionName: string;
  ballotsSubmittedLabel: string;
  outletCount: number;
  methodologyHref: string;
}) {
  const [query, setQuery] = useState("");
  const [showAllMobile, setShowAllMobile] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? voters.filter(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            v.organization.toLowerCase().includes(q),
        )
      : voters;
    return [...rows].sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
    );
  }, [query, voters]);

  const mobileRows = showAllMobile ? filtered : filtered.slice(0, 8);

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 overflow-x-clip pt-6">
      <div className="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Voters"
          value={String(voters.length)}
          detail={`${seasonYear} ${divisionName} panel`}
        />
        <StatCard
          label="Outlets"
          value={String(outletCount)}
          detail="newspapers, radio, TV, digital"
        />
        <StatCard
          label="Ballots submitted"
          value={ballotsSubmittedLabel}
          detail="latest published week"
        />
      </div>

      <div className="rounded-xl border border-primary/20 bg-accent/30 p-4 sm:p-5">
        <div className="flex gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
            <Users className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 text-sm">
            <div className="font-semibold">How voters are chosen</div>
            <p className="mt-1 text-muted-foreground">
              Invite-only: admins credential media who regularly cover{" "}
              {divisionName}.{" "}
              <Link
                href={methodologyHref}
                prefetch={false}
                className="text-primary hover:underline"
              >
                Methodology
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="relative w-full sm:w-72">
        <Search
          className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search voters or outlets"
          aria-label="Search voters or outlets"
          className="h-9 pl-8"
        />
      </div>

      <div className="hidden w-full min-w-0 max-w-full overflow-x-auto overflow-y-clip overscroll-x-contain rounded-xl border bg-card md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-1.5 text-left text-xs uppercase tracking-wide text-muted-foreground">
                Voter
              </th>
              <th className="px-3 py-1.5 text-left text-xs uppercase tracking-wide text-muted-foreground">
                Outlet / affiliation
              </th>
              <th className="px-3 py-1.5 text-right text-xs uppercase tracking-wide text-muted-foreground">
                Since
              </th>
              <th className="px-3 py-1.5 text-right text-xs uppercase tracking-wide text-muted-foreground">
                Season
              </th>
              <th className="px-3 py-1.5 text-right text-xs uppercase tracking-wide text-muted-foreground">
                Total
              </th>
              <th className="px-3 py-1.5 text-right text-xs uppercase tracking-wide text-muted-foreground">
                <span className="sr-only">Ballot</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((voter) => (
              <tr key={voter.id} className="border-b hover:bg-muted/50">
                <td className="px-3 py-1.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="size-7">
                      <AvatarFallback className="text-xs">
                        {initials(voter.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate font-semibold">{voter.name}</span>
                  </div>
                </td>
                <td className="max-w-64 px-3 py-1.5 text-muted-foreground">
                  <span className="line-clamp-1">
                    {voter.organization || "—"}
                    {voter.organizationRole
                      ? ` · ${voter.organizationRole}`
                      : ""}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right tabular text-muted-foreground">
                  {voter.voterSinceLabel}
                </td>
                <td className="px-3 py-1.5 text-right tabular">
                  {voter.ballotsSubmittedLabel}
                </td>
                <td className="px-3 py-1.5 text-right tabular">
                  {voter.totalBallotsLabel}
                </td>
                <td className="px-3 py-1.5 text-right">
                  <Link
                    href={voter.latestBallotHref}
                    prefetch={false}
                    className="inline-flex h-7 items-center rounded-md border px-2 text-sm font-medium hover:bg-accent"
                  >
                    Ballot
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid min-w-0 grid-cols-1 gap-2 md:hidden">
        {mobileRows.map((voter) => (
          <li
            key={voter.id}
            className="flex min-w-0 items-center gap-2 overflow-x-clip rounded-xl border bg-card px-2.5 py-2"
          >
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">
                {initials(voter.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{voter.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {voter.organization || "—"}
                {voter.organizationRole ? ` · ${voter.organizationRole}` : ""}
              </div>
              <div className="text-xs text-muted-foreground">
                Since {voter.voterSinceLabel} · {voter.ballotsSubmittedLabel}{" "}
                this season · {voter.totalBallotsLabel} total
              </div>
            </div>
            <Link
              href={voter.latestBallotHref}
              prefetch={false}
              className="inline-flex h-7 shrink-0 items-center rounded-md border px-2 text-sm font-medium"
            >
              Ballot
            </Link>
          </li>
        ))}
        {filtered.length > 8 && !showAllMobile ? (
          <li>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowAllMobile(true)}
            >
              Show all {filtered.length} voters
            </Button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
