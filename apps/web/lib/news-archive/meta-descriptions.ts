import { getBrandName, trimMetaDescription } from "@/lib/meta-description";

export function collegeNewsMetaDescription(pageIndex: number): string {
  const brand = getBrandName();

  if (pageIndex > 1) {
    return trimMetaDescription(
      `Page ${pageIndex} of college football and basketball news from ${brand}, with previews, recaps and analysis at every level.`,
    );
  }

  return trimMetaDescription(
    `College football and basketball news from ${brand}, from FBS to Division III and NAIA, with our own Top 25 and every voter's ballot.`,
  );
}

export function sportNewsMetaDescription(
  sportLabel: string,
  pageIndex: number,
): string {
  const brand = getBrandName();

  if (pageIndex > 1) {
    return trimMetaDescription(
      `Page ${pageIndex} of ${sportLabel} news from ${brand}: previews, recaps, coaching changes and analysis at every level.`,
    );
  }

  return trimMetaDescription(
    `${sportLabel} news from ${brand}: previews, recaps and analysis at every level, plus our own Top 25 with every voter's ballot.`,
  );
}

export function divisionNewsMetaDescription(
  divisionName: string,
  sportTitle: string,
  pageIndex: number,
): string {
  if (pageIndex > 1) {
    return trimMetaDescription(
      `Page ${pageIndex} of ${divisionName} ${sportTitle} news from Redshirt Sports: previews, recaps, coaching changes and analysis.`,
    );
  }

  return trimMetaDescription(
    `${divisionName} ${sportTitle} news from Redshirt Sports: game previews, recaps, coaching changes and conference title races.`,
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
      `Page ${pageIndex} of ${conferenceName} ${divisionLabel} ${sportTitle} news from ${brand}: previews, recaps and analysis.`,
    );
  }

  return trimMetaDescription(
    `${conferenceName} ${divisionLabel} ${sportTitle} news from ${brand}: game previews, recaps, standings races and coaching changes.`,
  );
}
