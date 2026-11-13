"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { type PortalDesk, pushPortalToSite } from "@/actions/portal";

function since(date: Date, now = new Date()) {
  const minutes = Math.max(
    0,
    Math.round((now.getTime() - date.getTime()) / 60_000),
  );
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} days ago`;
}

/**
 * Saves don't go live until pushed. This says how much is waiting and pushes
 * it; anything left is published by the 3 AM job.
 */
export function PortalPushBar({ pending }: { pending: PortalDesk["pending"] }) {
  const router = useRouter();
  const [pushing, startPush] = useTransition();
  const waiting = pending.players > 0;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
        waiting ? "border-amber-500/50 bg-amber-500/10" : "bg-muted/40"
      }`}
    >
      <p className="text-sm">
        {waiting ? (
          <>
            <span className="font-medium">
              {pending.changes} unpublished change
              {pending.changes === 1 ? "" : "s"}
            </span>{" "}
            for {pending.players} player{pending.players === 1 ? "" : "s"}
            {pending.oldestPendingSince
              ? `, oldest ${since(new Date(pending.oldestPendingSince))}`
              : ""}
            . Not on the site until pushed (or 3 AM).
          </>
        ) : (
          <span className="text-muted-foreground">
            Everything saved is on the site.
          </span>
        )}
      </p>
      <Button
        size="sm"
        disabled={!waiting || pushing}
        onClick={() =>
          startPush(async () => {
            const result = await pushPortalToSite();
            if (result.ok) toast.success(result.message);
            else toast.error(result.message);
            router.refresh();
          })
        }
      >
        {pushing ? "Pushing…" : "Push to site"}
      </Button>
    </div>
  );
}
