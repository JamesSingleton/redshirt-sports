import { parseISO } from "date-fns";

import { formatRelativeTime } from "@/lib/format-relative-time";

export function RelativeTime({
  dateString,
  className,
}: {
  dateString: string;
  className?: string;
}) {
  const date = parseISO(dateString);

  return (
    <time dateTime={dateString} className={className} suppressHydrationWarning>
      {formatRelativeTime(date)}
    </time>
  );
}
