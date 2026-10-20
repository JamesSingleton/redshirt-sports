"use client";

import { buttonVariants } from "@redshirt-sports/ui/components/button";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { Star, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * Dismissible personalization strip above the home hero. Dismissal is local
 * to the page view; team following itself ships separately.
 */
export function FollowTeamsBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="max-w-site mx-auto px-4 pt-4 lg:px-6">
      <div className="border-primary/25 bg-accent/50 flex items-center gap-3 rounded-xl border px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold">
          <Star className="text-primary size-4 shrink-0" aria-hidden />
          <span>Follow your teams to personalize Redshirt</span>
        </div>
        <Link
          href="/sign-in"
          prefetch={false}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Sign in to follow
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
