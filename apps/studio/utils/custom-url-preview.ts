export type CustomUrlPreviewInput = {
  urlType?: string;
  externalUrl?: string;
  internalType?: string;
  internalSlug?: string;
  internalDocType?: string;
  internalCustomUrl?: string;
  sportSlug?: string;
  routeDepth?: string;
  segmentSlug?: string;
  conferenceSlug?: string;
  openInNewTab?: boolean;
};

export function resolveCustomUrlPreview(
  input: CustomUrlPreviewInput,
): string | undefined {
  if (input.urlType === "external") {
    return input.externalUrl;
  }

  if (input.internalType === "custom") {
    return input.internalCustomUrl;
  }

  if (input.internalType === "sportNews") {
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

  if (input.internalType === "reference" || input.internalSlug) {
    const internalPaths: Record<string, string> = {
      post: `/${input.internalSlug}`,
      school: `/college/teams/${input.internalSlug}`,
      author: `/authors/${input.internalSlug}`,
      legal: `/${input.internalSlug}`,
    };
    if (input.internalDocType) {
      return (
        internalPaths[input.internalDocType] ?? `/${input.internalSlug ?? ""}`
      );
    }
  }

  return undefined;
}

export function formatCustomUrlLinkSubtitle({
  urlType,
  url,
  openInNewTab,
  maxLength = 30,
}: {
  urlType?: string;
  url?: string;
  openInNewTab?: boolean;
  maxLength?: number;
}) {
  const newTabIndicator = openInNewTab ? " ↗" : "";
  const truncatedUrl =
    url && url.length > maxLength ? `${url.substring(0, maxLength)}...` : url;

  return `${urlType === "external" ? "External" : "Internal"} • ${truncatedUrl ?? "No URL"}${newTabIndicator}`;
}

export const customUrlPreviewSelect = {
  externalUrl: "external",
  urlType: "type",
  internalType: "internalType",
  internalSlug: "internal.slug.current",
  internalDocType: "internal._type",
  internalCustomUrl: "internalUrl",
  sportSlug: "sportNewsLink.sport.slug.current",
  routeDepth: "sportNewsLink.routeDepth",
  segmentSlug: "sportNewsLink.segment.slug.current",
  conferenceSlug: "sportNewsLink.conference.slug.current",
  openInNewTab: "openInNewTab",
} as const;

export function nestedCustomUrlPreviewSelect(prefix: string) {
  return Object.fromEntries(
    Object.entries(customUrlPreviewSelect).map(([key, path]) => [
      key,
      `${prefix}.${path}`,
    ]),
  );
}

export function prepareCustomUrlPreview(
  input: CustomUrlPreviewInput & { title?: string },
) {
  const url = resolveCustomUrlPreview(input);
  const newTabIndicator = input.openInNewTab ? " ↗" : "";

  return {
    title:
      input.title ??
      `${input.urlType === "external" ? "External" : "Internal"} Link`,
    subtitle: `${url ?? "No URL"}${newTabIndicator}`,
  };
}
