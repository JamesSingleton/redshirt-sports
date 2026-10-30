"use client";

import { useEffect, useState } from "react";

import { stablePublishedLabel } from "@/components/relative-time";
import { formatArchivePublishedAt } from "@/lib/news-archive";

export function ArchivePublishedTime({
  dateString,
  className,
}: {
  dateString: string;
  className?: string;
}) {
  const [label, setLabel] = useState(() =>
    stablePublishedLabel(dateString, "M/d/yyyy"),
  );

  useEffect(() => {
    setLabel(formatArchivePublishedAt(dateString));
  }, [dateString]);

  return (
    <time dateTime={dateString} className={className}>
      {label}
    </time>
  );
}
