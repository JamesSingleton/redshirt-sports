import { nestLists } from "@portabletext/toolkit";

import type { RawLinkFinding } from "../../types";

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
