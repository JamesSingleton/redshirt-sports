/** e.g. `1 pt`, `512 pts` */
export function formatPollPoints(points: number): string {
  return `${points} pt${points === 1 ? "" : "s"}`;
}
