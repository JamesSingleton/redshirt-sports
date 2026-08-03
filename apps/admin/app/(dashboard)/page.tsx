import { Button } from "@redshirt-sports/ui/components/button";
import { Separator } from "@redshirt-sports/ui/components/separator";
import {
  IconArrowRight,
  IconDatabase,
  IconExternalLink,
  IconListDetails,
  IconTrophy,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { Suspense } from "react";

import { getDashboardData } from "@/actions/dashboard";
import { PUBLIC_SITE_URL } from "@/lib/site";

function DashboardFallback() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-col gap-2">
        <div className="bg-muted h-3 w-28 animate-pulse rounded" />
        <div className="bg-muted h-10 w-72 max-w-full animate-pulse rounded" />
        <div className="bg-muted h-4 w-96 max-w-full animate-pulse rounded" />
      </div>
      <div className="bg-muted h-80 w-full animate-pulse rounded-xl" />
    </div>
  );
}

function progressPercent(submitted: number | null, assigned: number) {
  if (submitted == null || assigned === 0) return 0;
  return Math.min(100, Math.round((submitted / assigned) * 100));
}

async function DashboardContent() {
  const data = await getDashboardData();
  const outstanding = data.panels.reduce((sum, panel) => {
    if (panel.submittedCount == null) return sum;
    return sum + Math.max(0, panel.assignedCount - panel.submittedCount);
  }, 0);

  return (
    <div className="flex flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
          Operations
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {data.headline
            ? `${data.headline.sportTitle} · ${data.headline.weekLabel}`
            : "Ballot desk"}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          {data.headline
            ? `${data.headline.year} Top 25 panels — ${outstanding} ballot${outstanding === 1 ? "" : "s"} still out this week.`
            : "Track panel rosters and this week's ballot progress."}
        </p>
      </header>

      <section
        aria-labelledby="panel-readiness-heading"
        className="overflow-hidden rounded-xl border"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 border-b px-5 py-4">
          <div className="flex flex-col gap-0.5">
            <h2
              id="panel-readiness-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Panel readiness
            </h2>
            <p className="text-muted-foreground text-sm">
              Assigned voters vs ballots in for the current week
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/voters">
              Manage panels
              <IconArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        {data.panels.length === 0 ? (
          <div className="text-muted-foreground px-5 py-12 text-center text-sm">
            No polls yet. Run the Development loaders, then assign voters.
          </div>
        ) : (
          <ul className="divide-y">
            {data.panels.map((panel) => {
              const pct = progressPercent(
                panel.submittedCount,
                panel.assignedCount,
              );
              const complete =
                panel.submittedCount != null &&
                panel.assignedCount > 0 &&
                panel.submittedCount >= panel.assignedCount;

              return (
                <li
                  key={panel.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">{panel.name}</span>
                      {!panel.isActive ? (
                        <span className="text-muted-foreground text-xs tracking-wide uppercase">
                          Inactive
                        </span>
                      ) : null}
                    </div>
                    <span className="text-muted-foreground text-xs tracking-wide uppercase">
                      {panel.sportTitle}
                      {panel.weekLabel ? ` · ${panel.weekLabel}` : ""}
                    </span>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:max-w-xs sm:flex-1">
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className={
                          complete
                            ? "bg-foreground h-full rounded-full transition-[width]"
                            : "bg-foreground/70 h-full rounded-full transition-[width]"
                        }
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-muted-foreground flex justify-between font-mono text-xs tabular-nums">
                      <span>
                        {panel.submittedCount == null
                          ? "— / "
                          : `${panel.submittedCount} / `}
                        {panel.assignedCount} in
                      </span>
                      <span>
                        {panel.assignedCount === 0
                          ? "No panel"
                          : panel.submittedCount == null
                            ? "Week n/a"
                            : `${pct}%`}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section
          aria-labelledby="desk-heading"
          className="flex flex-col overflow-hidden rounded-xl border"
        >
          <div className="border-b px-5 py-4">
            <h2
              id="desk-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Desk
            </h2>
            <p className="text-muted-foreground text-sm">
              Jump into the work that keeps rankings honest
            </p>
          </div>
          <ul className="divide-y">
            <li>
              <Link
                href="/rankings"
                className="hover:bg-muted/50 flex items-center gap-3 px-5 py-4 transition-colors"
              >
                <IconTrophy className="text-muted-foreground size-5 shrink-0" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">Publish rankings</span>
                  <span className="text-muted-foreground text-sm">
                    Close a week, nudge missing voters, publish Top 25
                  </span>
                </span>
                <IconArrowRight className="text-muted-foreground size-4" />
              </Link>
            </li>
            <li>
              <Link
                href="/voters"
                className="hover:bg-muted/50 flex items-center gap-3 px-5 py-4 transition-colors"
              >
                <IconUsers className="text-muted-foreground size-5 shrink-0" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">Voting panels</span>
                  <span className="text-muted-foreground text-sm">
                    Credentials and Top 25 panel rosters
                  </span>
                </span>
                <IconArrowRight className="text-muted-foreground size-4" />
              </Link>
            </li>
            <li>
              <Link
                href="/polls"
                className="hover:bg-muted/50 flex items-center gap-3 px-5 py-4 transition-colors"
              >
                <IconListDetails className="text-muted-foreground size-5 shrink-0" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">Polls</span>
                  <span className="text-muted-foreground text-sm">
                    Create FBS, FCS, D2, D3, and basketball panels
                  </span>
                </span>
                <IconArrowRight className="text-muted-foreground size-4" />
              </Link>
            </li>
            <li>
              <Link
                href="/development"
                className="hover:bg-muted/50 flex items-center gap-3 px-5 py-4 transition-colors"
              >
                <IconDatabase className="text-muted-foreground size-5 shrink-0" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">Data loaders</span>
                  <span className="text-muted-foreground text-sm">
                    Sync sports, schools, seasons, and rankings
                  </span>
                </span>
                <IconArrowRight className="text-muted-foreground size-4" />
              </Link>
            </li>
            <li>
              <a
                href={PUBLIC_SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-muted/50 flex items-center gap-3 px-5 py-4 transition-colors"
              >
                <IconExternalLink className="text-muted-foreground size-5 shrink-0" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">Public site</span>
                  <span className="text-muted-foreground text-sm">
                    Open redshirtsports.xyz
                  </span>
                </span>
                <IconArrowRight className="text-muted-foreground size-4" />
              </a>
            </li>
          </ul>
        </section>

        <section
          aria-labelledby="snapshot-heading"
          className="flex flex-col overflow-hidden rounded-xl border"
        >
          <div className="border-b px-5 py-4">
            <h2
              id="snapshot-heading"
              className="text-lg font-semibold tracking-tight"
            >
              Snapshot
            </h2>
            <p className="text-muted-foreground text-sm">
              Who can vote, and what needs cleanup
            </p>
          </div>
          <dl className="flex flex-col gap-0 divide-y">
            <div className="flex items-baseline justify-between gap-4 px-5 py-4">
              <dt className="text-muted-foreground text-sm">
                Credentialed voters
              </dt>
              <dd className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
                {data.credentialedVoters}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-5 py-4">
              <dt className="text-muted-foreground text-sm">Active panels</dt>
              <dd className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
                {data.activePanels}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-5 py-4">
              <dt className="text-muted-foreground text-sm">Accounts</dt>
              <dd className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
                {data.totalUsers}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-5 py-4">
              <dt className="text-muted-foreground text-sm">
                Stale panel assignments
              </dt>
              <dd className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
                {data.staleAssignments}
              </dd>
            </div>
          </dl>
          {data.staleAssignments > 0 ? (
            <>
              <Separator />
              <div className="px-5 py-4">
                <p className="text-muted-foreground text-sm">
                  {data.staleAssignments} assignment
                  {data.staleAssignments === 1 ? "" : "s"} still open for people
                  without voter credentials. Open Voting panels to clean up, or
                  they clear on the next voters page load.
                </p>
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default function AdminHomePage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}
