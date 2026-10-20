import { formatDistanceToNow, parseISO } from "date-fns";

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
      {formatDistanceToNow(date, { addSuffix: true })}
    </time>
  );
}
