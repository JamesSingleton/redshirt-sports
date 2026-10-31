import { getBrandName, trimMetaDescription } from "@/lib/meta-description";

export function personArchiveMetaDescription({
  name,
  roles,
  biography,
  pageIndex,
}: {
  name: string;
  roles: string;
  biography?: string | null;
  pageIndex: number;
}): string {
  const brand = getBrandName();

  if (pageIndex > 1) {
    return trimMetaDescription(
      `Page ${pageIndex} of articles by ${name}, ${roles} at ${brand}. Game analysis, news, and columns from a Redshirt Sports contributor covering college athletics.`,
    );
  }

  const fromBio = biography?.replace(/\s+/g, " ").trim();
  if (fromBio && fromBio.length >= 90) {
    return trimMetaDescription(fromBio);
  }

  return trimMetaDescription(
    `Read articles by ${name}, ${roles} at ${brand}. Coverage spans college football and basketball with analysis, news, and opinion from the Redshirt Sports staff and contributors.`,
  );
}

export function searchPageMetaDescription(): string {
  const brand = getBrandName();
  return trimMetaDescription(
    `Search ${brand} for college football and basketball stories, rankings, and analysis. Find news by team, conference, division, author, or topic across every level we cover.`,
  );
}

export function contactPageMetaDescription(): string {
  const brand = getBrandName();
  return trimMetaDescription(
    `Contact ${brand} for news tips, corrections, advertising, partnerships, or Top 25 poll questions. We welcome feedback from readers, coaches, and media partners.`,
  );
}
