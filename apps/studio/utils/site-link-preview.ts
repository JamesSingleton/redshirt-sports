export type SiteLinkPreviewInput = {
  linkType?: string;
  sitePath?: string;
  external?: string;
  documentSlug?: string;
  documentType?: string;
  sportSlug?: string;
  routeDepth?: string;
  segmentSlug?: string;
  conferenceSlug?: string;
  openInNewTab?: boolean;
};

export function resolveSiteLinkPreview(
  input: SiteLinkPreviewInput,
): string | undefined {
  if (input.linkType === "external") {
    return input.external;
  }

  if (input.linkType === "sitePath") {
    return input.sitePath;
  }

  if (input.linkType === "document" && input.documentSlug) {
    const internalPaths: Record<string, string> = {
      post: `/${input.documentSlug}`,
      school: `/college/teams/${input.documentSlug}`,
      author: `/authors/${input.documentSlug}`,
      legal: `/${input.documentSlug}`,
    };

    if (input.documentType) {
      return internalPaths[input.documentType] ?? `/${input.documentSlug}`;
    }
  }

  if (input.linkType === "sportNews") {
    if (!input.sportSlug) {
      return undefined;
    }

    if (input.routeDepth === "conferenceNews") {
      if (input.segmentSlug && input.conferenceSlug) {
        return `/college/${input.sportSlug}/news/${input.segmentSlug}/${input.conferenceSlug}`;
      }
      return undefined;
    }

    if (input.routeDepth === "divisionNews") {
      if (input.segmentSlug) {
        return `/college/${input.sportSlug}/news/${input.segmentSlug}`;
      }
      return undefined;
    }

    return `/college/${input.sportSlug}/news`;
  }

  return undefined;
}

export function formatSiteLinkSubtitle({
  linkType,
  url,
  openInNewTab,
  maxLength = 40,
}: {
  linkType?: string;
  url?: string;
  openInNewTab?: boolean;
  maxLength?: number;
}) {
  const labels: Record<string, string> = {
    sitePath: "Site path",
    document: "Document",
    sportNews: "Sport news",
    external: "External",
  };
  const kind = labels[linkType ?? ""] ?? "Link";
  const newTabIndicator = openInNewTab ? " ↗" : "";
  const truncatedUrl =
    url && url.length > maxLength ? `${url.substring(0, maxLength)}...` : url;

  return `${kind} · ${truncatedUrl ?? "No URL"}${newTabIndicator}`;
}

export const siteLinkPreviewSelect = {
  linkType: "linkType",
  sitePath: "sitePath",
  external: "external",
  documentSlug: "document.slug.current",
  documentType: "document._type",
  sportSlug: "sport.slug.current",
  routeDepth: "routeDepth",
  segmentSlug: "segment.slug.current",
  conferenceSlug: "conference.slug.current",
  openInNewTab: "openInNewTab",
} as const;

export function nestedSiteLinkPreviewSelect(prefix: string) {
  return Object.fromEntries(
    Object.entries(siteLinkPreviewSelect).map(([key, path]) => [
      key,
      `${prefix}.${path}`,
    ]),
  );
}
