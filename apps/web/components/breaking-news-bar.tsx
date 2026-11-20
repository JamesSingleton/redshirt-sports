"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Runs while the HTML is parsed, before first paint: a cached page can
 * outlive its alert, and removing the strip after paint would move the page.
 */
const HIDE_IF_EXPIRED = `(function(s){var a=s&&s.previousElementSibling;if(a&&Date.parse(a.getAttribute("data-expires-at"))<=Date.now())a.hidden=true})(document.currentScript)`;

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
  // Starts false to match the server HTML; HIDE_IF_EXPIRED has already
  // hidden an expired strip before paint, and the effect then removes it.
  const [expired, setExpired] = useState(false);

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
    <>
      <aside
        aria-label="Breaking news"
        className="border-b bg-primary text-primary-foreground"
        data-expires-at={expiresAt}
        suppressHydrationWarning
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
      <script dangerouslySetInnerHTML={{ __html: HIDE_IF_EXPIRED }} />
    </>
  );
}
