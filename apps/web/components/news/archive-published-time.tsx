"use client";

import { formatArchivePublishedAt } from "@/lib/news-archive";

export function ArchivePublishedTime({
  dateString,
  className,
}: {
  dateString: string;
  className?: string;
}) {
  return (
    <time dateTime={dateString} className={className} suppressHydrationWarning>
      {formatArchivePublishedAt(dateString)}
    </time>
  );
}
