"use client";

import { Avatar, AvatarFallback } from "@redshirt-sports/ui/components/avatar";
import { Button } from "@redshirt-sports/ui/components/button";
import { Input } from "@redshirt-sports/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@redshirt-sports/ui/components/select";
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
    <div className="rounded-xl border bg-card p-3 sm:p-4">
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
    if (!q) return voters;
    return voters.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.organization.toLowerCase().includes(q),
    );
  }, [query, voters]);

  const mobileRows = showAllMobile ? filtered : filtered.slice(0, 8);

  return (
    <div className="grid gap-4 pt-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
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
          <div className="text-sm">
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

      <div className="flex flex-wrap items-center gap-2">
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
        <Select defaultValue="name">
          <SelectTrigger className="h-9 w-[10rem]" aria-label="Sort voters">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort: name A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="hidden max-w-full overflow-x-auto overflow-y-clip overscroll-x-contain rounded-xl border bg-card md:block">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b">
              <th className="p-2 pl-4 text-left text-sm uppercase tracking-wide text-muted-foreground">
                Voter
              </th>
              <th className="p-2 text-left text-sm uppercase tracking-wide text-muted-foreground">
                Outlet / affiliation
              </th>
              <th className="p-2 text-right text-sm uppercase tracking-wide text-muted-foreground">
                Voter since
              </th>
              <th className="p-2 text-right text-sm uppercase tracking-wide text-muted-foreground">
                {seasonYear} ballots
              </th>
              <th className="p-2 pr-4 text-right text-sm uppercase tracking-wide text-muted-foreground">
                Links
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((voter) => (
              <tr key={voter.id} className="border-b hover:bg-muted/50">
                <td className="p-2 pl-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarFallback className="text-sm">
                        {initials(voter.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{voter.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {voter.organizationRole || "—"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-2 text-muted-foreground">
                  {voter.organization || "—"}
                </td>
                <td className="p-2 text-right tabular text-muted-foreground">
                  {voter.voterSinceLabel}
                </td>
                <td className="p-2 text-right tabular">
                  {voter.ballotsSubmittedLabel}
                </td>
                <td className="p-2 pr-4 text-right">
                  <div className="flex justify-end gap-1.5">
                    <Link
                      href={voter.latestBallotHref}
                      prefetch={false}
                      className="inline-flex h-7 items-center rounded-md border px-2 text-sm font-medium hover:bg-accent"
                    >
                      Latest ballot
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-2 md:hidden">
        {mobileRows.map((voter) => (
          <li key={voter.id} className="rounded-xl border bg-card p-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback>{initials(voter.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{voter.name}</div>
                <div className="truncate text-sm text-muted-foreground">
                  {voter.organization}
                  {voter.organizationRole ? ` · ${voter.organizationRole}` : ""}
                </div>
                <div className="text-sm text-muted-foreground">
                  Since {voter.voterSinceLabel} · {voter.ballotsSubmittedLabel}{" "}
                  {seasonYear} ballots
                </div>
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <Link
                href={voter.latestBallotHref}
                prefetch={false}
                className="rounded-md border px-2 py-1 text-sm font-medium"
              >
                Ballot
              </Link>
            </div>
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
