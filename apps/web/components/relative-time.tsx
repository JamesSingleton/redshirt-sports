"use client";

import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { useEffect, useState } from "react";

import { formatRelativeTime } from "@/lib/format-relative-time";

const PUBLISHED_TIME_ZONE = "America/Phoenix";

/** Calendar label with no current-time read, so prerender stays stable. */
export function stablePublishedLabel(
  dateString: string,
  pattern = "LLL d, yyyy",
): string {
  return formatInTimeZone(dateString, PUBLISHED_TIME_ZONE, pattern);
}

export function RelativeTime({
  dateString,
  className,
}: {
  dateString: string;
  className?: string;
}) {
  const [label, setLabel] = useState(() => stablePublishedLabel(dateString));

  useEffect(() => {
    // Date.now() during render aborts the Cache Components prerender.
    setLabel(formatRelativeTime(parseISO(dateString)));
  }, [dateString]);

  return (
    <time dateTime={dateString} className={className}>
      {label}
    </time>
  );
}
