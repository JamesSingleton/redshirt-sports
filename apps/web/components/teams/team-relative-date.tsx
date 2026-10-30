"use client";

import { parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useEffect, useState } from "react";

import { stablePublishedLabel } from "@/components/relative-time";
import { formatRelativeTime } from "@/lib/format-relative-time";

const TIME_ZONE = "America/Phoenix";

export function TeamRelativeDate({ dateString }: { dateString: string }) {
  const [label, setLabel] = useState(() => stablePublishedLabel(dateString));

  useEffect(() => {
    setLabel(formatRelativeTime(toZonedTime(parseISO(dateString), TIME_ZONE)));
  }, [dateString]);

  return <time dateTime={dateString}>{label}</time>;
}
