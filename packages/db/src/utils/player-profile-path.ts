function slugifyName(firstName: string, lastName: string): string {
  return `${firstName}-${lastName}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function playerProfilePath(player: {
  publicId: string;
  firstName: string;
  lastName: string;
}): string {
  return `/players/${slugifyName(player.firstName, player.lastName)}-${player.publicId}`;
}

export function formatHeightInches(height: number | null | undefined): string | null {
  if (height == null) {
    return null;
  }

  const feet = Math.floor(height / 12);
  const inches = height % 12;
  return `${feet}-${inches}`;
}
