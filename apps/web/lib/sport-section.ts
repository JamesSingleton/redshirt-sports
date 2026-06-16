export function getCollegeSportSection(
  sport?: { title?: string | null } | null,
): string | undefined {
  if (!sport?.title) {
    return undefined;
  }

  const normalized = sport.title.trim();
  if (!normalized) {
    return undefined;
  }

  if (normalized.toLowerCase().startsWith("college ")) {
    return normalized;
  }

  return `College ${normalized}`;
}
