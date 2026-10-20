export type TeamDirectorySchool = {
  _id: string;
  name: string;
  shortName: string | null;
  nickname: string | null;
  slug: string;
  image?: unknown;
  sortName: string;
  searchHaystack: string;
};

export function mapTeamDirectorySchool(
  school: {
    _id: string;
    name: string;
    shortName: string | null;
    nickname: string | null;
    slug: string | null;
    image?: unknown;
  },
): TeamDirectorySchool | null {
  if (!school.slug) {
    return null;
  }

  const sortName = school.shortName ?? school.name;
  const haystack = [school.name, sortName, school.nickname]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return {
    _id: school._id,
    name: school.name,
    shortName: school.shortName,
    nickname: school.nickname,
    slug: school.slug,
    image: school.image,
    sortName,
    searchHaystack: haystack,
  };
}

export function groupTeamsByLetter(
  teams: TeamDirectorySchool[],
): { letter: string; teams: TeamDirectorySchool[] }[] {
  const groups = new Map<string, TeamDirectorySchool[]>();

  for (const team of teams) {
    const first = team.sortName.trim().charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : "#";
    const bucket = groups.get(letter) ?? [];
    bucket.push(team);
    groups.set(letter, bucket);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, letterTeams]) => ({
      letter,
      teams: letterTeams,
    }));
}
