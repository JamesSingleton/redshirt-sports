import { getBrandName, trimMetaDescription } from "@/lib/meta-description";

export function collegeNewsMetaDescription(pageIndex: number): string {
  const brand = getBrandName();

  if (pageIndex > 1) {
    return trimMetaDescription(
      `Page ${pageIndex} of college sports news from ${brand}. More football and basketball coverage, analysis, recruiting notes, and transparent Top 25 rankings updated all season long.`,
    );
  }

  return trimMetaDescription(
    `Latest college football and basketball news, analysis, and features from ${brand}. Coverage across FBS, FCS, D2, D3, and NAIA with transparent voter ballots on every poll.`,
  );
}

export function sportNewsMetaDescription(
  sportLabel: string,
  pageIndex: number,
): string {
  const brand = getBrandName();

  if (pageIndex > 1) {
    return trimMetaDescription(
      `Page ${pageIndex} of ${sportLabel} news and analysis from ${brand}. Game previews, roster moves, coaching updates, and in-depth reporting from every division we cover.`,
    );
  }

  return trimMetaDescription(
    `Browse the latest ${sportLabel} news, game analysis, recruiting updates, and team coverage from ${brand}. Independent reporting and published Top 25 ballots across NCAA levels.`,
  );
}

export function divisionNewsMetaDescription(
  divisionName: string,
  sportTitle: string,
  pageIndex: number,
): string {
  if (pageIndex > 1) {
    return trimMetaDescription(
      `More ${divisionName} ${sportTitle} stories on Page ${pageIndex}. Continued coverage of recruiting updates, game previews, injury reports, and in-depth team analysis from Redshirt Sports.`,
    );
  }

  return trimMetaDescription(
    `Complete ${divisionName} ${sportTitle} coverage including breaking news, game analysis, player spotlights, and coaching updates. Your go-to source for ${sportTitle} insights.`,
  );
}

export function conferenceNewsMetaDescription(
  conferenceName: string,
  divisionLabel: string,
  sportTitle: string,
  pageIndex: number,
): string {
  const brand = getBrandName();

  if (pageIndex > 1) {
    return trimMetaDescription(
      `Continue exploring ${conferenceName} ${divisionLabel} ${sportTitle} coverage on Page ${pageIndex}. More detailed articles, updates, and analysis from ${brand}.`,
    );
  }

  return trimMetaDescription(
    `Stay informed with breaking ${conferenceName} ${divisionLabel} ${sportTitle} news and in-depth analysis. ${brand} delivers comprehensive coverage, articles, and updates you need.`,
  );
}
