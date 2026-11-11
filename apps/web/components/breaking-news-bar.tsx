"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * The breaking-news strip under the site header. Hides itself at
 * `expiresAt` on the reader's clock: a cached page can outlive the alert.
 */
export function BreakingNewsBar({
  label,
  title,
  slug,
  expiresAt,
}: {
  label: string;
  title: string;
  slug: string;
  expiresAt: string;
}) {
  const [expired, setExpired] = useState(
    () => new Date(expiresAt).getTime() <= Date.now(),
  );

  useEffect(() => {
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining <= 0) {
      setExpired(true);
      return;
    }
    // setTimeout caps at ~24.8 days; an alert lasts at most 48 hours.
    const timer = setTimeout(() => setExpired(true), remaining);
    return () => clearTimeout(timer);
  }, [expiresAt]);

  if (expired) return null;

  return (
    <aside
      aria-label="Breaking news"
      className="border-b bg-primary text-primary-foreground"
    >
      <div className="mx-auto flex max-w-site items-center gap-3 px-4 py-2 text-sm lg:px-6">
        <span className="shrink-0 font-display font-bold uppercase tracking-wide">
          {label}
        </span>
        <Link
          href={`/${slug}`}
          prefetch={false}
          className="min-w-0 truncate font-semibold underline-offset-2 hover:underline"
        >
          {title}
        </Link>
      </div>
    </aside>
  );
}
