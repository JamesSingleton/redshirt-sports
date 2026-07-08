import { nestLists } from "@portabletext/toolkit";

import type {
  CustomUrlObject,
  RawLinkFinding,
  SiteLinkObject,
} from "../../types";

type TypedObject = {
  _type?: string;
  _key?: string;
  [key: string]: unknown;
};

type PortableTextTextBlock = TypedObject & {
  _type: "block";
  children?: TypedObject[];
  markDefs?: TypedObject[];
  style?: string;
};

function isTypedObject(value: unknown): value is TypedObject {
  return typeof value === "object" && value !== null && "_type" in value;
}

function isPortableTextTextBlock(
  block: unknown,
): block is PortableTextTextBlock {
  return (
    isTypedObject(block) &&
    block._type === "block" &&
    Array.isArray(block.children)
  );
}

function isPortableTextSpan(span: unknown): span is TypedObject & {
  _type: "span";
  text?: string;
  marks?: string[];
} {
  return isTypedObject(span) && span._type === "span";
}

function shouldSkipUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed === "#") {
    return true;
  }
  return /^(mailto:|tel:|#)/i.test(trimmed);
}

function getMarkLabel(block: unknown, markKey: string): string | undefined {
  if (!isPortableTextTextBlock(block)) {
    return undefined;
  }

  for (const child of block.children ?? []) {
    if (isPortableTextSpan(child) && child.marks?.includes(markKey)) {
      return child.text;
    }
  }

  return undefined;
}

function addFinding(
  findings: RawLinkFinding[],
  seenIds: Set<string>,
  finding: RawLinkFinding,
) {
  if (seenIds.has(finding.id)) {
    return;
  }
  seenIds.add(finding.id);
  findings.push(finding);
}

function collectFromTextBlock(
  block: unknown,
  findings: RawLinkFinding[],
  seenIds: Set<string>,
) {
  if (!isPortableTextTextBlock(block)) {
    return;
  }

  const markDefs = block.markDefs ?? [];

  for (const mark of markDefs) {
    if (!isTypedObject(mark)) {
      continue;
    }

    const markKey = mark._key ?? mark._type;

    if (mark._type === "customLink") {
      const customUrl = (mark as { customLink?: RawLinkFinding["customUrl"] })
        .customLink;
      const label = mark._key ? getMarkLabel(block, mark._key) : undefined;

      if (!customUrl) {
        addFinding(findings, seenIds, {
          id: `incomplete:${markKey}`,
          label,
          source: "customLink",
          incomplete: true,
          incompleteMessage: "Incomplete link — missing URL configuration",
          blockKey: block._key,
          markKey: mark._key,
        });
        continue;
      }

      if (customUrl.type === "external" && customUrl.external) {
        if (shouldSkipUrl(customUrl.external)) {
          continue;
        }
        addFinding(findings, seenIds, {
          id: customUrl.external,
          url: customUrl.external,
          label,
          source: "customLink",
          blockKey: block._key,
          markKey: mark._key,
        });
        continue;
      }

      if (
        customUrl.type === "internal" &&
        customUrl.internalType === "custom"
      ) {
        if (customUrl.internalUrl && !shouldSkipUrl(customUrl.internalUrl)) {
          addFinding(findings, seenIds, {
            id: customUrl.internalUrl,
            url: customUrl.internalUrl,
            label,
            source: "customLink",
            blockKey: block._key,
            markKey: mark._key,
          });
          continue;
        }
      }

      addFinding(findings, seenIds, {
        id: `customLink:${markKey}`,
        label,
        source: "customLink",
        customUrl,
        refId: customUrl.internal?._ref,
        blockKey: block._key,
        markKey: mark._key,
      });
      continue;
    }

    if (mark._type === "link") {
      const href = (mark as { href?: string }).href;
      const label = mark._key ? getMarkLabel(block, mark._key) : undefined;

      if (!href) {
        addFinding(findings, seenIds, {
          id: `legacy:${markKey}`,
          label,
          source: "legacyLink",
          incomplete: true,
          incompleteMessage: "Incomplete link — missing URL",
          blockKey: block._key,
          markKey: mark._key,
        });
        continue;
      }

      if (shouldSkipUrl(href)) {
        continue;
      }

      addFinding(findings, seenIds, {
        id: href,
        url: href,
        label,
        source: "legacyLink",
        blockKey: block._key,
        markKey: mark._key,
      });
      continue;
    }

    if (mark._type === "internalLink") {
      const reference = (mark as { reference?: { _ref?: string } }).reference;
      const label = mark._key ? getMarkLabel(block, mark._key) : undefined;

      if (!reference?._ref) {
        addFinding(findings, seenIds, {
          id: `internal:${markKey}`,
          label,
          source: "internalLink",
          incomplete: true,
          incompleteMessage: "Incomplete link — missing document reference",
          blockKey: block._key,
          markKey: mark._key,
        });
        continue;
      }

      addFinding(findings, seenIds, {
        id: `ref:${reference._ref}`,
        label,
        source: "internalLink",
        refId: reference._ref,
        blockKey: block._key,
        markKey: mark._key,
      });
    }
  }
}

function collectFromBlock(
  block: unknown,
  findings: RawLinkFinding[],
  seenIds: Set<string>,
) {
  if (!isTypedObject(block)) {
    return;
  }

  if (block._type === "block") {
    collectFromTextBlock(block, findings, seenIds);
    return;
  }

  if (block._type === "youtubeEmbed") {
    const url = (block as { url?: string }).url;
    if (url && !shouldSkipUrl(url)) {
      addFinding(findings, seenIds, {
        id: url,
        url,
        source: "youtube",
        blockKey: block._key,
      });
    }
  }
}

function walkNestedBlocks(
  value: unknown,
  findings: RawLinkFinding[],
  seenIds: Set<string>,
) {
  if (Array.isArray(value)) {
    for (const item of value) {
      walkNestedBlocks(item, findings, seenIds);
    }
    return;
  }

  if (!isTypedObject(value)) {
    return;
  }

  collectFromBlock(value, findings, seenIds);

  for (const nestedValue of Object.values(value)) {
    if (Array.isArray(nestedValue)) {
      walkNestedBlocks(nestedValue, findings, seenIds);
    }
  }
}

export function extractLinks(body: unknown): RawLinkFinding[] {
  if (!Array.isArray(body) || !body.every(isTypedObject)) {
    return [];
  }

  const findings: RawLinkFinding[] = [];
  const seenIds = new Set<string>();
  const nestedBlocks = nestLists(
    body as Array<{ _type: string; _key?: string; [key: string]: unknown }>,
    "direct",
  );

  walkNestedBlocks(nestedBlocks, findings, seenIds);

  return findings;
}

export function extractIncompleteLinks(body: unknown): RawLinkFinding[] {
  return extractLinks(body).filter((finding) => finding.incomplete);
}

type NavFooterLinkRow = {
  _key?: string;
  name?: string;
  link?: SiteLinkObject;
  url?: CustomUrlObject;
};

function addSiteLinkFinding(
  findings: RawLinkFinding[],
  seenIds: Set<string>,
  {
    id,
    label,
    siteLink,
    url,
  }: {
    id: string;
    label?: string;
    siteLink?: SiteLinkObject;
    url?: string;
  },
) {
  if (seenIds.has(id)) {
    return;
  }
  seenIds.add(id);

  if (url && !shouldSkipUrl(url)) {
    findings.push({
      id,
      url,
      label,
      source: "siteLink",
    });
    return;
  }

  if (!siteLink?.linkType) {
    findings.push({
      id,
      label,
      source: "siteLink",
      incomplete: true,
      incompleteMessage: "Incomplete link — missing destination",
    });
    return;
  }

  if (siteLink.linkType === "external" && siteLink.external) {
    if (shouldSkipUrl(siteLink.external)) {
      return;
    }
    findings.push({
      id,
      url: siteLink.external,
      label,
      source: "siteLink",
    });
    return;
  }

  if (siteLink.linkType === "sitePath" && siteLink.sitePath) {
    if (shouldSkipUrl(siteLink.sitePath)) {
      return;
    }
    findings.push({
      id,
      url: siteLink.sitePath,
      label,
      source: "siteLink",
    });
    return;
  }

  findings.push({
    id,
    label,
    source: "siteLink",
    siteLink,
    refId: siteLink.document?._ref,
  });
}

function extractLinkRow(
  row: NavFooterLinkRow,
  findings: RawLinkFinding[],
  seenIds: Set<string>,
  idPrefix: string,
) {
  const id = `${idPrefix}:${row._key ?? "unknown"}`;
  const siteLink = row.link;
  const legacyUrl = row.url;

  if (legacyUrl) {
    findings.push({
      id,
      label: row.name,
      source: "customLink",
      customUrl: legacyUrl,
      refId: legacyUrl.internal?._ref,
    });
    return;
  }

  addSiteLinkFinding(findings, seenIds, {
    id,
    label: row.name,
    siteLink,
  });
}

export function extractNavFooterLinks(
  document: Record<string, unknown> | undefined,
): RawLinkFinding[] {
  if (!document) {
    return [];
  }

  const docType = document._type;
  if (docType !== "navbar" && docType !== "footer") {
    return [];
  }

  const findings: RawLinkFinding[] = [];
  const seenIds = new Set<string>();
  const columns = document.columns;

  if (!Array.isArray(columns)) {
    return findings;
  }

  for (const column of columns) {
    if (!isTypedObject(column)) {
      continue;
    }

    if (docType === "footer") {
      const links = column.links;
      if (!Array.isArray(links)) {
        continue;
      }
      for (const link of links) {
        if (!isTypedObject(link)) {
          continue;
        }
        extractLinkRow(
          link as NavFooterLinkRow,
          findings,
          seenIds,
          `footer:${String(column._key)}`,
        );
      }
      continue;
    }

    if (column._type === "navbarLink") {
      extractLinkRow(
        column as NavFooterLinkRow,
        findings,
        seenIds,
        "navbar:link",
      );
      continue;
    }

    if (column._type === "navbarColumn") {
      const links = column.links;
      if (Array.isArray(links)) {
        for (const link of links) {
          if (!isTypedObject(link)) {
            continue;
          }
          extractLinkRow(
            link as NavFooterLinkRow,
            findings,
            seenIds,
            `navbar:${String(column._key)}`,
          );
        }
      }

      const sections = column.sections;
      if (Array.isArray(sections)) {
        for (const section of sections) {
          if (!isTypedObject(section) || !Array.isArray(section.links)) {
            continue;
          }
          for (const link of section.links) {
            if (!isTypedObject(link)) {
              continue;
            }
            const legacyLink = link as NavFooterLinkRow & {
              url?: CustomUrlObject;
            };
            if (legacyLink.url) {
              extractLinkRow(
                legacyLink,
                findings,
                seenIds,
                `navbar:${String(column._key)}:legacy`,
              );
            }
          }
        }
      }
    }
  }

  return findings;
}
