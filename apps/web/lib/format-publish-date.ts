import {
  differenceInCalendarDays,
  differenceInHours,
  differenceInMinutes,
  format,
  parseISO,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TIME_ZONE = "America/Phoenix";
const ABSOLUTE_DATE_THRESHOLD_DAYS = 5;

export function formatPublishDate(
  dateString: string,
  now: Date = new Date(),
): string {
  const published = toZonedTime(parseISO(dateString), TIME_ZONE);
  const nowZoned = toZonedTime(now, TIME_ZONE);

  const days = differenceInCalendarDays(nowZoned, published);

  if (days >= ABSOLUTE_DATE_THRESHOLD_DAYS) {
    return format(published, "LLL d, yyyy");
  }

  if (days >= 1) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }

  const hours = differenceInHours(nowZoned, published);

  if (hours >= 1) {
    return `${hours}h`;
  }

  const minutes = differenceInMinutes(nowZoned, published);

  if (minutes >= 1) {
    return `${minutes}m`;
  }

  return "just now";
}
