import {
  IconArrowRight,
  IconChecklist,
  IconTransfer,
} from "@tabler/icons-react";
import Link from "next/link";

import type { Area } from "@/lib/access";

/**
 * Home for staff who aren't admins: a card for each part of the admin they
 * can use, and nothing about ballot counts, missed ballots, or panels.
 */
export function StaffHome({
  firstName,
  areas,
  portalPending,
}: {
  firstName: string | null;
  areas: readonly Area[];
  /** Portal players saved but not yet pushed; null without the portal area. */
  portalPending: number | null;
}) {
  return (
    <div className="flex flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
          Redshirt Sports
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {firstName ? `Welcome, ${firstName}` : "Welcome"}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Here&apos;s what you can work on.
        </p>
      </header>
      <ul className="grid gap-4 md:grid-cols-2">
        {areas.includes("portal") ? (
          <li>
            <Link
              href="/portal"
              prefetch={false}
              className="hover:bg-muted/50 flex h-full items-start gap-4 rounded-xl border p-5 transition-colors"
            >
              <IconTransfer className="text-muted-foreground size-6 shrink-0" />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-medium">Transfer portal</span>
                <span className="text-muted-foreground text-sm">
                  Add players, record moves and offers, and push them to the
                  site.
                </span>
                {portalPending ? (
                  <span className="text-sm font-medium">
                    {portalPending} player{portalPending === 1 ? "" : "s"}{" "}
                    waiting to push
                  </span>
                ) : null}
              </span>
              <IconArrowRight className="text-muted-foreground size-4" />
            </Link>
          </li>
        ) : null}
        {areas.includes("ballots") ? (
          <li>
            <Link
              href="/ballots"
              prefetch={false}
              className="hover:bg-muted/50 flex h-full items-start gap-4 rounded-xl border p-5 transition-colors"
            >
              <IconChecklist className="text-muted-foreground size-6 shrink-0" />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-medium">Ballots</span>
                <span className="text-muted-foreground text-sm">
                  Read this week&apos;s ballots and catch mistakes before
                  rankings are published.
                </span>
              </span>
              <IconArrowRight className="text-muted-foreground size-4" />
            </Link>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
