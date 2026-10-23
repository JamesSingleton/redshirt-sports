export function formatVoterSince(date: Date | null | undefined): string {
  if (!date) {
    return "—";
  }
  return String(new Date(date).getFullYear());
}
