/** "10" for regular-season weeks, "postseason" for the postseason (same shape as rankings URLs). */
export function ratingWeekSegment(seasonType: number, number: number): string {
  return seasonType === 3 ? "postseason" : String(number);
}

export function parseRatingWeekSegment(
  segment: string,
): { seasonType: number; number: number } | null {
  if (segment === "postseason") return { seasonType: 3, number: 1 };
  const match = segment.match(/^([1-9]\d?)$/);
  return match ? { seasonType: 2, number: Number(match[1]) } : null;
}

export function ratingWeekLabel(seasonType: number, number: number): string {
  return seasonType === 3 ? "Postseason" : `Week ${number}`;
}
