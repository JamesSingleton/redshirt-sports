import type { SanityClient } from "@sanity/client";

import {
  type CustomUrlPreviewInput,
  resolveCustomUrlPreview,
} from "@/utils/custom-url-preview";
import type {
  CustomUrlObject,
  LinkFinding,
  RawLinkFinding,
  RefDocument,
} from "../../types";
import { normalizeLinkUrl } from "../../utils/linkUrl";

const REF_QUERY = /* groq */ `
  *[_id in $ids]{
    _id,
    _type,
    "slug": slug.current,
    publishedAt
  }
`;

function collectRefIds(findings: RawLinkFinding[]): string[] {
  const refIds = new Set<string>();

  for (const finding of findings) {
    if (finding.refId) {
      refIds.add(finding.refId);
    }

    const customUrl = finding.customUrl;
    if (!customUrl) {
      continue;
    }

    if (customUrl.internal?._ref) {
      refIds.add(customUrl.internal._ref);
    }

    const sportNews = customUrl.sportNewsLink;
    if (sportNews?.sport?._ref) {
      refIds.add(sportNews.sport._ref);
    }
    if (sportNews?.segment?._ref) {
      refIds.add(sportNews.segment._ref);
    }
    if (sportNews?.conference?._ref) {
      refIds.add(sportNews.conference._ref);
    }
  }

  return [...refIds];
}

function buildRefMap(docs: RefDocument[]): Map<string, RefDocument> {
  const refMap = new Map<string, RefDocument>();

  for (const doc of docs) {
    refMap.set(doc._id, doc);
    if (doc._id.startsWith("drafts.")) {
      refMap.set(doc._id.replace(/^drafts\./, ""), doc);
    }
  }

  return refMap;
}

function resolveInternalLinkPath(
  refId: string,
  refMap: Map<string, RefDocument>,
): {
  url?: string;
  message?: string;
  refExists: boolean;
  unpublished?: boolean;
} {
  const doc = refMap.get(refId);

  if (!doc) {
    return {
      refExists: false,
      message: "Referenced document not found",
    };
  }

  if (!doc.slug) {
    return {
      refExists: true,
      message: "Referenced document is missing a slug",
    };
  }

  const paths: Record<string, string> = {
    post: `/${doc.slug}`,
    school: `/college/teams/${doc.slug}`,
    author: `/authors/${doc.slug}`,
    legal: `/${doc.slug}`,
  };

  const url = paths[doc._type] ?? `/${doc.slug}`;
  const unpublished = doc._type === "post" && !doc.publishedAt;

  return {
    url,
    refExists: true,
    unpublished,
  };
}

function resolveCustomUrlObject(
  customUrl: CustomUrlObject,
  refMap: Map<string, RefDocument>,
): {
  url?: string;
  message?: string;
  refId?: string;
  checkViaHttp: boolean;
  unpublished?: boolean;
} {
  if (customUrl.type === "external") {
    return {
      url: customUrl.external,
      checkViaHttp: true,
    };
  }

  if (customUrl.type === "internal" && customUrl.internalType === "custom") {
    return {
      url: customUrl.internalUrl,
      checkViaHttp: true,
    };
  }

  if (customUrl.type === "internal" && customUrl.internalType === "reference") {
    const refId = customUrl.internal?._ref;
    if (!refId) {
      return {
        message: "Incomplete link — missing document reference",
        checkViaHttp: false,
      };
    }

    const resolved = resolveInternalLinkPath(refId, refMap);
    return {
      url: resolved.url,
      message: resolved.message,
      refId,
      checkViaHttp: false,
      unpublished: resolved.unpublished,
    };
  }

  if (customUrl.type === "internal" && customUrl.internalType === "sportNews") {
    const sportNews = customUrl.sportNewsLink;
    const sportDoc = sportNews?.sport?._ref
      ? refMap.get(sportNews.sport._ref)
      : undefined;
    const segmentDoc = sportNews?.segment?._ref
      ? refMap.get(sportNews.segment._ref)
      : undefined;
    const conferenceDoc = sportNews?.conference?._ref
      ? refMap.get(sportNews.conference._ref)
      : undefined;

    const previewInput: CustomUrlPreviewInput = {
      urlType: "internal",
      internalType: "sportNews",
      sportSlug: sportDoc?.slug,
      routeDepth: sportNews?.routeDepth,
      segmentSlug: segmentDoc?.slug,
      conferenceSlug: conferenceDoc?.slug,
    };

    const url = resolveCustomUrlPreview(previewInput);
    if (!url) {
      return {
        message: "Incomplete sport news archive link",
        checkViaHttp: false,
      };
    }

    return {
      url,
      checkViaHttp: true,
    };
  }

  return {
    message: "Incomplete link — missing URL configuration",
    checkViaHttp: false,
  };
}

export async function resolveLinkFindings(
  findings: RawLinkFinding[],
  client: SanityClient,
): Promise<LinkFinding[]> {
  const refIds = collectRefIds(findings);
  const draftIds = refIds.map((id) => `drafts.${id}`);
  const allIds = [...new Set([...refIds, ...draftIds])];

  const docs =
    allIds.length > 0
      ? await client.fetch<RefDocument[]>(REF_QUERY, { ids: allIds })
      : [];

  const refMap = buildRefMap(docs);

  return findings.map((finding) => {
    if (finding.incomplete) {
      return {
        id: finding.id,
        label: finding.label,
        source: finding.source,
        status: "warning",
        message: finding.incompleteMessage ?? "Incomplete link",
        incomplete: true,
        blockKey: finding.blockKey,
        markKey: finding.markKey,
        checkViaHttp: false,
      };
    }

    if (finding.url) {
      return {
        id: finding.id,
        url: normalizeLinkUrl(finding.url),
        label: finding.label,
        source: finding.source,
        status: "initial",
        blockKey: finding.blockKey,
        markKey: finding.markKey,
        checkViaHttp: true,
      };
    }

    if (finding.customUrl) {
      const resolved = resolveCustomUrlObject(finding.customUrl, refMap);
      const messages = [
        resolved.message,
        resolved.unpublished ? "Linked post is not published yet" : undefined,
      ].filter(Boolean);

      return {
        id: finding.id,
        url: normalizeLinkUrl(resolved.url),
        label: finding.label,
        source: finding.source,
        status: resolved.url && !resolved.message ? "initial" : "warning",
        message: messages.join(". ") || undefined,
        refId: resolved.refId,
        blockKey: finding.blockKey,
        markKey: finding.markKey,
        incomplete: !resolved.url,
        checkViaHttp: resolved.checkViaHttp,
      };
    }

    if (finding.refId) {
      const resolved = resolveInternalLinkPath(finding.refId, refMap);
      const messages = [
        resolved.message,
        resolved.unpublished ? "Linked post is not published yet" : undefined,
      ].filter(Boolean);

      return {
        id: finding.id,
        url: normalizeLinkUrl(resolved.url),
        label: finding.label,
        source: finding.source,
        status:
          resolved.url && resolved.refExists && !resolved.message
            ? "initial"
            : resolved.refExists
              ? "warning"
              : "error",
        message: messages.join(". ") || undefined,
        refId: finding.refId,
        blockKey: finding.blockKey,
        markKey: finding.markKey,
        checkViaHttp: false,
      };
    }

    return {
      id: finding.id,
      label: finding.label,
      source: finding.source,
      status: "warning",
      message: "Could not resolve link",
      blockKey: finding.blockKey,
      markKey: finding.markKey,
      checkViaHttp: false,
    };
  });
}
