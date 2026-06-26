import { formatPublishDate } from "@/lib/format-publish-date";
import type { WithClassName } from "@/types";

interface RelativePublishDateProps extends WithClassName {
  dateString: string;
}

export default function RelativePublishDate({
  dateString,
  className,
}: RelativePublishDateProps) {
  return (
    <time dateTime={dateString} className={className} suppressHydrationWarning>
      {formatPublishDate(dateString)}
    </time>
  );
}
