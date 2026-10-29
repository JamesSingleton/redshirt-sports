import { parseWeekSegment } from "@redshirt-sports/clients/espn";
import { notFound } from "next/navigation";

export function resolveRankingsYear(year: string): number {
  if (!/^\d{4}$/.test(year)) {
    notFound();
  }
  return Number(year);
}

export function resolveRankingsWeek(week: string): number {
  try {
    return parseWeekSegment(week);
  } catch {
    notFound();
  }
}
