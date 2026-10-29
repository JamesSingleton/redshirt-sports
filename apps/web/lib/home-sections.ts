export type HomeCoveragePost = {
  _id: string;
  sportSlug?: string | null;
  divisionSlug?: string | null;
  subgroupingSlug?: string | null;
};

export type HomeCoverageSectionDefinition = {
  id: string;
  title: string;
  href: string;
  sportSlug: string;
  scopeSlug: string | null;
};

export const HOME_COVERAGE_SECTIONS = [
  {
    id: "fcs",
    title: "FCS",
    href: "/college/football/news/fcs",
    sportSlug: "football",
    scopeSlug: "fcs",
  },
  {
    id: "fbs",
    title: "FBS",
    href: "/college/football/news/fbs",
    sportSlug: "football",
    scopeSlug: "fbs",
  },
  {
    id: "mid-major",
    title: "Mid-Major Men's Basketball",
    href: "/college/mens-basketball/news/mid-major",
    sportSlug: "mens-basketball",
    scopeSlug: "mid-major",
  },
  {
    id: "d2",
    title: "Division II Football",
    href: "/college/football/news/d2",
    sportSlug: "football",
    scopeSlug: "d2",
  },
  {
    id: "d3",
    title: "Division III Football",
    href: "/college/football/news/d3",
    sportSlug: "football",
    scopeSlug: "d3",
  },
  {
    id: "power-conferences",
    title: "Power Conference Men's Basketball",
    href: "/college/mens-basketball/news/power-conferences",
    sportSlug: "mens-basketball",
    scopeSlug: "power-conferences",
  },
  {
    id: "womens-basketball",
    title: "Women's Basketball",
    href: "/college/womens-basketball/news",
    sportSlug: "womens-basketball",
    scopeSlug: null,
  },
] as const satisfies readonly HomeCoverageSectionDefinition[];

const DEFAULT_RESERVED_COUNT = 12;
const DEFAULT_PER_SECTION = 4;
const DEFAULT_MINIMUM = 3;

export function postMatchesHomeSection(
  post: HomeCoveragePost,
  section: HomeCoverageSectionDefinition,
): boolean {
  if (post.sportSlug !== section.sportSlug) {
    return false;
  }
  if (!section.scopeSlug) {
    return true;
  }
  return (
    post.subgroupingSlug === section.scopeSlug ||
    post.divisionSlug === section.scopeSlug
  );
}

export function buildHomeCoverageSections<T extends HomeCoveragePost>(
  posts: T[],
  options?: {
    reservedCount?: number;
    perSection?: number;
    minimum?: number;
  },
): Array<HomeCoverageSectionDefinition & { posts: T[] }> {
  const reservedCount = options?.reservedCount ?? DEFAULT_RESERVED_COUNT;
  const perSection = options?.perSection ?? DEFAULT_PER_SECTION;
  const minimum = options?.minimum ?? DEFAULT_MINIMUM;
  const used = new Set(posts.slice(0, reservedCount).map((post) => post._id));
  const sections: Array<HomeCoverageSectionDefinition & { posts: T[] }> = [];

  for (const section of HOME_COVERAGE_SECTIONS) {
    const matched: T[] = [];
    for (const post of posts) {
      if (used.has(post._id) || !postMatchesHomeSection(post, section)) {
        continue;
      }
      used.add(post._id);
      matched.push(post);
      if (matched.length === perSection) {
        break;
      }
    }
    if (matched.length >= minimum) {
      sections.push({ ...section, posts: matched });
      continue;
    }
    // A short list would leave a hole in the grid, so give those posts back.
    for (const post of matched) {
      used.delete(post._id);
    }
  }

  return sections;
}
