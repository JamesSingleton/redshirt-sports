/** Up to two uppercase initials for avatar fallbacks. */
export function getInitials(name?: string | null): string {
  if (!name) return "RS";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "RS";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}
