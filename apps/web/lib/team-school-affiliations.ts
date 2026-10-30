export type TeamConferenceAffiliationInput = {
  sport: { slug: string | null } | null;
  conference: {
    name: string | null;
    shortName: string | null;
    slug?: string | null;
    primaryClassification?: {
      slug: string | null;
      name: string | null;
    } | null;
    sportSubdivisions?: Array<{
      sport: { slug: string | null } | null;
      subdivision: {
        shortName: string | null;
        name: string | null;
        slug: string | null;
      } | null;
    }> | null;
    sportSubdivisionAffiliations?: Array<{
      sport: { slug: string | null } | null;
      subgrouping: {
        shortName: string | null;
        name: string | null;
        slug: string | null;
      } | null;
    }> | null;
  } | null;
};

const FOOTBALL_SPORT_SLUG = "football";

type SportSubgroup = {
  shortName: string | null;
  name: string | null;
  slug: string | null;
};

function sportSubgroup(
  conference: NonNullable<TeamConferenceAffiliationInput["conference"]>,
  sportSlug: string,
): SportSubgroup | null {
  const fromAffiliations = conference.sportSubdivisionAffiliations?.find(
    (row) => row.sport?.slug === sportSlug,
  )?.subgrouping;
  if (fromAffiliations) {
    return fromAffiliations;
  }

  const fromSubdivisions = conference.sportSubdivisions?.find(
    (row) => row.sport?.slug === sportSlug,
  )?.subdivision;
  return fromSubdivisions ?? null;
}

function footballSubdivisionSlug(
  affiliations: TeamConferenceAffiliationInput[] | null | undefined,
): string | null {
  const football = affiliations?.find(
    (row) => row.sport?.slug === FOOTBALL_SPORT_SLUG && row.conference,
  );
  if (!football?.conference) {
    return null;
  }
  return sportSubgroup(football.conference, FOOTBALL_SPORT_SLUG)?.slug ?? null;
}

export function buildTeamHubKicker(
  affiliations: TeamConferenceAffiliationInput[] | null | undefined,
): string | null {
  if (!affiliations?.length) {
    return null;
  }

  const parts: string[] = [];

  const football = affiliations.find(
    (row) => row.sport?.slug === FOOTBALL_SPORT_SLUG && row.conference,
  );
  if (football?.conference) {
    const conf =
      football.conference.shortName ?? football.conference.name ?? null;
    if (conf) {
      parts.push(conf);
    }
    const fbSub = footballSubdivisionSlug(affiliations);
    if (fbSub === "fbs" || fbSub === "fcs") {
      parts.push(`${fbSub.toUpperCase()} football`);
    } else {
      parts.push("Football");
    }
  }

  for (const sportSlug of ["mens-basketball", "womens-basketball"] as const) {
    const row = affiliations.find((a) => a.sport?.slug === sportSlug);
    if (!row?.conference) {
      continue;
    }
    const subgroup = sportSubgroup(row.conference, sportSlug);
    const classSlug =
      subgroup?.slug ?? row.conference.primaryClassification?.slug;
    const label =
      classSlug === "mid-major"
        ? "Mid-Major basketball"
        : classSlug === "power-conferences" || classSlug === "power-conference"
          ? "Power Conference basketball"
          : classSlug === "d1"
            ? "D-I basketball"
            : classSlug === "d2"
              ? "D-II basketball"
              : classSlug === "d3"
                ? "D-III basketball"
                : row.sport?.slug === "womens-basketball"
                  ? "Women's basketball"
                  : "Men's basketball";
    parts.push(label);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

export type TeamInfoFactRow = { label: string; value: string };

function conferenceLabel(
  conference: NonNullable<TeamConferenceAffiliationInput["conference"]>,
): string | null {
  return conference.shortName ?? conference.name ?? null;
}

function classificationDisplayName(
  slug: string | null | undefined,
  name: string | null | undefined,
): string | null {
  if (slug === "d1") {
    return "Division I";
  }
  if (slug === "d2") {
    return "Division II";
  }
  if (slug === "d3") {
    return "Division III";
  }
  if (slug === "naia") {
    return "NAIA";
  }
  if (slug === "mid-major") {
    return "Mid-Major";
  }
  if (slug === "power-conferences" || slug === "power-conference") {
    return "Power Conference";
  }
  const trimmed = name?.trim();
  return trimmed ? trimmed : null;
}

function subgroupDisplayName(subgroup: SportSubgroup): string | null {
  return (
    classificationDisplayName(subgroup.slug, null) ??
    subgroup.shortName ??
    subgroup.name
  );
}

function footballSubdivisionLabel(
  conference: NonNullable<TeamConferenceAffiliationInput["conference"]>,
): string | null {
  const match = sportSubgroup(conference, FOOTBALL_SPORT_SLUG);
  return (
    match?.shortName ??
    match?.name ??
    (match?.slug ? match.slug.toUpperCase() : null)
  );
}

function sportAffiliationValue(
  sportSlug: string,
  affiliation: TeamConferenceAffiliationInput,
): string | null {
  const conference = affiliation.conference;
  if (!conference) {
    return null;
  }
  const conf = conferenceLabel(conference);

  if (sportSlug === FOOTBALL_SPORT_SLUG) {
    const subdivision = footballSubdivisionLabel(conference);
    if (subdivision && conf) {
      return `${subdivision} · ${conf}`;
    }
    return subdivision ?? conf;
  }

  const subgroup = sportSubgroup(conference, sportSlug);
  const division = subgroup
    ? subgroupDisplayName(subgroup)
    : classificationDisplayName(
        conference.primaryClassification?.slug,
        conference.primaryClassification?.name,
      );
  if (division && conf) {
    return `${division} · ${conf}`;
  }
  return division ?? conf;
}

export function buildTeamInfoFactRows(
  school: { name: string; nickname: string | null },
  affiliations: TeamConferenceAffiliationInput[] | null | undefined,
): TeamInfoFactRow[] {
  const rows: TeamInfoFactRow[] = [{ label: "School", value: school.name }];

  if (school.nickname) {
    rows.push({ label: "Nickname", value: school.nickname });
  }

  const football = affiliations?.find(
    (row) => row.sport?.slug === FOOTBALL_SPORT_SLUG && row.conference,
  );
  if (football) {
    const value = sportAffiliationValue(FOOTBALL_SPORT_SLUG, football);
    if (value) {
      rows.push({ label: "Football", value });
    }
  }

  const mensBasketball = affiliations?.find(
    (row) => row.sport?.slug === "mens-basketball" && row.conference,
  );
  const womensBasketball = affiliations?.find(
    (row) => row.sport?.slug === "womens-basketball" && row.conference,
  );

  const sameBasketballConference =
    mensBasketball?.conference?.slug &&
    womensBasketball?.conference?.slug &&
    mensBasketball.conference.slug === womensBasketball.conference.slug;

  if (mensBasketball && (!womensBasketball || sameBasketballConference)) {
    const value = sportAffiliationValue("mens-basketball", mensBasketball);
    if (value) {
      rows.push({ label: "Basketball", value });
    }
  } else if (womensBasketball && !mensBasketball) {
    const value = sportAffiliationValue("womens-basketball", womensBasketball);
    if (value) {
      rows.push({ label: "Basketball", value });
    }
  } else {
    if (mensBasketball) {
      const value = sportAffiliationValue("mens-basketball", mensBasketball);
      if (value) {
        rows.push({ label: "Men's basketball", value });
      }
    }
    if (womensBasketball) {
      const value = sportAffiliationValue(
        "womens-basketball",
        womensBasketball,
      );
      if (value) {
        rows.push({ label: "Women's basketball", value });
      }
    }
  }

  return rows;
}

export function conferenceNewsHrefForAffiliation(
  affiliation: TeamConferenceAffiliationInput,
): string | null {
  const sportSlug = affiliation.sport?.slug;
  const conference = affiliation.conference;
  if (!sportSlug || !conference?.slug) {
    return null;
  }

  const divisionSegment =
    sportSubgroup(conference, sportSlug)?.slug ??
    conference.primaryClassification?.slug ??
    null;

  if (!divisionSegment) {
    return null;
  }

  return `/college/${sportSlug}/news/${divisionSegment}/${conference.slug}`;
}

export type TeamInfoAthleticsLink = {
  href: string;
  title: string;
  subtitle: string;
};

export type TeamSocialLink = {
  id: string;
  label: string;
  href: string;
};

const SOCIAL_NETWORK_LABELS: Record<string, string> = {
  twitter: "X",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  bluesky: "Bluesky",
  threads: "Threads",
  linkedin: "LinkedIn",
};

const SOCIAL_LINK_ORDER = [
  "twitter",
  "facebook",
  "instagram",
  "youtube",
  "bluesky",
  "threads",
  "linkedin",
] as const;

export function buildTeamInfoAthleticsLink(
  websiteUrl: string | null,
): TeamInfoAthleticsLink | null {
  if (!websiteUrl) {
    return null;
  }

  let subtitle = websiteUrl;
  try {
    subtitle = new URL(websiteUrl).hostname.replace(/^www\./, "");
  } catch {
    subtitle = websiteUrl.replace(/^https?:\/\//, "");
  }

  return {
    href: websiteUrl,
    title: "Official athletics site",
    subtitle,
  };
}

export function buildTeamSocialLinks(
  socialLinks: Record<string, string | undefined> | null,
): TeamSocialLink[] {
  if (!socialLinks) {
    return [];
  }

  const links: TeamSocialLink[] = [];

  for (const id of SOCIAL_LINK_ORDER) {
    const href = socialLinks[id];
    if (typeof href !== "string" || href.trim().length === 0) {
      continue;
    }
    links.push({
      id,
      label: SOCIAL_NETWORK_LABELS[id] ?? id,
      href,
    });
  }

  for (const [id, href] of Object.entries(socialLinks)) {
    if (
      SOCIAL_LINK_ORDER.includes(id as (typeof SOCIAL_LINK_ORDER)[number]) ||
      typeof href !== "string" ||
      href.trim().length === 0
    ) {
      continue;
    }
    links.push({
      id,
      label: SOCIAL_NETWORK_LABELS[id] ?? id,
      href,
    });
  }

  return links;
}
