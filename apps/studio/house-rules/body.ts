import { LIMITS } from "./limits";
import {
  isCurrentLink,
  isLegacyLink,
  type LinkValue,
  linkDirection,
  linkTargetFindings,
} from "./links";
import { styleFindingsFor, VAGUE_LINK_TEXT } from "./style-guide";
import { isAllCaps } from "./text";
import {
  type BodyBlock,
  error,
  type Finding,
  isSpan,
  isTextBlock,
  type TextBlock,
  warning,
} from "./types";

export const HEADING_STYLES = ["h2", "h3", "h4"] as const;
/** Embeds an article can carry. Three in a row with no words is a link dump. */
const EMBED_TYPES = new Set([
  "twitter",
  "youtubeEmbed",
  "socialEmbed",
  "bracketEmbed",
]);

const headingLevel = (style: string | undefined): number | null => {
  const match = style?.match(/^h([1-6])$/);
  return match ? Number(match[1]) : null;
};

export function blockText(block: TextBlock): string {
  return (block.children ?? [])
    .map((child) => (isSpan(child) ? (child.text ?? "") : ""))
    .join("");
}

export const countWords = (text: string): number =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

const isHeading = (block: BodyBlock): block is TextBlock =>
  isTextBlock(block) && headingLevel(block.style) !== null;

const isParagraph = (block: BodyBlock): block is TextBlock =>
  isTextBlock(block) &&
  (block.style === "normal" || block.style === undefined) &&
  !block.listItem;

export type BodyStats = {
  words: number;
  readingMinutes: number;
  paragraphs: number;
  headings: number;
  images: number;
  embeds: number;
  internalLinks: number;
  externalLinks: number;
  ledeWords: number;
};

export function bodyStats(body: BodyBlock[] | undefined | null): BodyStats {
  const blocks = body ?? [];
  let words = 0;
  let paragraphs = 0;
  let headings = 0;
  let images = 0;
  let embeds = 0;
  let internalLinks = 0;
  let externalLinks = 0;
  let ledeWords = 0;
  let sawLede = false;

  for (const block of blocks) {
    if (isTextBlock(block)) {
      const text = blockText(block);
      const blockWords = countWords(text);
      words += blockWords;
      if (isHeading(block)) headings += 1;
      if (isParagraph(block) && blockWords > 0) {
        paragraphs += 1;
        if (!sawLede) {
          ledeWords = blockWords;
          sawLede = true;
        }
      }
      for (const markDef of block.markDefs ?? []) {
        const direction = linkDirection(markDef);
        if (direction === "internal") internalLinks += 1;
        if (direction === "external") externalLinks += 1;
      }
    } else if (block._type === "image") {
      images += 1;
    } else if (EMBED_TYPES.has(block._type)) {
      embeds += 1;
    } else if (block._type === "relatedArticle") {
      internalLinks += 1;
    }
  }

  return {
    words,
    readingMinutes: Math.max(1, Math.round(words / LIMITS.body.wordsPerMinute)),
    paragraphs,
    headings,
    images,
    embeds,
    internalLinks,
    externalLinks,
    ledeWords,
  };
}

/**
 * The heading style each heading block should have so the outline is valid:
 * the first heading is an h2, no level is skipped going down, and nothing is
 * deeper than h4. Returns only the blocks whose style must change.
 */
export function normalizedHeadingStyles(
  body: BodyBlock[] | undefined | null,
): Map<string, string> {
  const changes = new Map<string, string>();
  let previous = 1;
  for (const block of body ?? []) {
    if (!isTextBlock(block)) continue;
    const level = headingLevel(block.style);
    if (level === null) continue;
    const next = Math.min(Math.max(level, 2), previous + 1, 4);
    if (next !== level) changes.set(block._key, `h${next}`);
    previous = next;
  }
  return changes;
}

function headingFindings(blocks: BodyBlock[]): Finding[] {
  const findings: Finding[] = [];
  const headings = blocks.filter(isHeading);
  let previousLevel: number | null = null;

  for (const heading of headings) {
    const level = headingLevel(heading.style) as number;
    const text = blockText(heading).trim();

    if (previousLevel === null && level !== 2) {
      findings.push(
        error(
          "body.first-heading",
          "The first subheading must be a Heading 2. The headline is the page's Heading 1.",
          heading._key,
        ),
      );
    }
    if (level === 1 || level > 4) {
      findings.push(
        error(
          "body.heading-level",
          "Use Heading 2, 3, or 4. Other levels aren't part of the article template.",
          heading._key,
        ),
      );
    }
    if (previousLevel !== null && level - previousLevel > 1) {
      findings.push(
        error(
          "body.heading-skip",
          `A Heading ${level} can't follow a Heading ${previousLevel}. Use Heading ${previousLevel + 1} so the outline doesn't skip a level.`,
          heading._key,
        ),
      );
    }
    if (!text) {
      findings.push(
        error(
          "body.heading-empty",
          "This subheading is empty. Delete it or give it text.",
          heading._key,
        ),
      );
    } else {
      if (text.length > LIMITS.body.headingChars) {
        findings.push(
          warning(
            "body.heading-long",
            `Subheading is ${text.length} characters. Keep subheadings under ${LIMITS.body.headingChars} so they scan.`,
            heading._key,
          ),
        );
      }
      if (/[.:]$/.test(text)) {
        findings.push(
          warning(
            "body.heading-punctuation",
            "Subheadings don't end with a period or colon.",
            heading._key,
          ),
        );
      }
      if (isAllCaps(text)) {
        findings.push(
          warning(
            "body.heading-caps",
            "Don't write subheadings in all capitals.",
            heading._key,
          ),
        );
      }
    }
    previousLevel = level;
  }

  blocks.forEach((block, index) => {
    const next = blocks[index + 1];
    if (isHeading(block) && next && isHeading(next)) {
      const stepsDown =
        (headingLevel(next.style) as number) >
        (headingLevel(block.style) as number);
      if (!stepsDown) {
        findings.push(
          warning(
            "body.heading-stacked",
            "Two subheadings in a row with nothing between them. Add copy under the first or remove one.",
            next._key,
          ),
        );
      }
    }
  });

  const last = blocks.at(-1);
  if (last && isHeading(last)) {
    findings.push(
      warning(
        "body.heading-last",
        "The article ends on a subheading with nothing under it.",
        last._key,
      ),
    );
  }
  return findings;
}

/** Rules about a link's text. Its destination is checked on the link itself. */
function linkFindings(block: TextBlock): Finding[] {
  const findings: Finding[] = [];
  for (const markDef of block.markDefs ?? []) {
    const legacy = isLegacyLink(markDef);
    if (!legacy && !isCurrentLink(markDef)) continue;

    const linkedText = (block.children ?? [])
      .filter(isSpan)
      .filter((span) => span.marks?.includes(markDef._key))
      .map((span) => span.text ?? "")
      .join("")
      .trim();

    if (legacy) {
      findings.push(
        error(
          "link.legacy",
          `"${linkedText || "A link"}" uses the old link format. Remove the link and add it again with the Link button.`,
          block._key,
        ),
      );
      continue;
    }
    if (!linkedText) {
      findings.push(
        warning(
          "link.empty",
          "A link in this paragraph isn't attached to any text. Remove it.",
          block._key,
        ),
      );
      continue;
    }
    if (VAGUE_LINK_TEXT.includes(linkedText.toLowerCase())) {
      findings.push(
        warning(
          "link.vague-text",
          `Link text "${linkedText}" doesn't say where the link goes. Link the words that describe the destination.`,
          block._key,
        ),
      );
    }
    if (/^https?:\/\//i.test(linkedText)) {
      findings.push(
        warning(
          "link.raw-url",
          "Don't show a raw URL as link text. Link descriptive words instead.",
          block._key,
        ),
      );
    }
  }
  return findings;
}

/** Destination rules for every link in the body, for the Article check pane. */
export function bodyLinkTargetFindings(
  body: BodyBlock[] | undefined | null,
): Finding[] {
  return (body ?? []).flatMap((block) =>
    isTextBlock(block)
      ? (block.markDefs ?? []).filter(isCurrentLink).flatMap((markDef) =>
          linkTargetFindings(markDef as LinkValue).map((finding) => ({
            ...finding,
            blockKey: block._key,
          })),
        )
      : [],
  );
}

function paragraphFindings(blocks: BodyBlock[]): Finding[] {
  const findings: Finding[] = [];
  let emptyReported = false;

  for (const block of blocks) {
    if (!isTextBlock(block)) continue;
    const text = blockText(block);

    if (isParagraph(block)) {
      const words = countWords(text);
      if (words === 0 && !emptyReported) {
        // One finding is enough; the fix is the same for every empty line.
        findings.push(
          warning(
            "body.empty-paragraph",
            "Remove empty paragraphs. The site spaces paragraphs for you.",
            block._key,
          ),
        );
        emptyReported = true;
      }
      if (words > LIMITS.body.paragraphWords) {
        findings.push(
          warning(
            "body.long-paragraph",
            `This paragraph is ${words} words. Break paragraphs over ${LIMITS.body.paragraphWords} words so they read well on a phone.`,
            block._key,
          ),
        );
      }
      if (isAllCaps(text)) {
        findings.push(
          warning(
            "body.caps-paragraph",
            "Don't write whole paragraphs in capitals.",
            block._key,
          ),
        );
      }
    }
    if (headingLevel(block.style) === null) {
      for (const hit of styleFindingsFor(text)) {
        findings.push(warning(`style.${hit.id}`, hit.advice, block._key));
      }
    }
    findings.push(...linkFindings(block));
  }
  return findings;
}

function structureFindings(blocks: BodyBlock[]): Finding[] {
  const findings: Finding[] = [];
  const stats = bodyStats(blocks);
  const first: BodyBlock | undefined = blocks[0];
  const opensWithParagraph = first ? isParagraph(first) : true;

  if (first && !opensWithParagraph) {
    findings.push(
      warning(
        "body.lede-first",
        "Open with a paragraph that states the news. Search engines and AI answers quote the first paragraph.",
        first._key,
      ),
    );
  } else if (stats.ledeWords > LIMITS.body.ledeWords) {
    findings.push(
      warning(
        "body.lede-long",
        `The opening paragraph is ${stats.ledeWords} words. Say who did what in ${LIMITS.body.ledeWords} words or fewer, then explain.`,
        first?._key,
      ),
    );
  }

  if (stats.words < LIMITS.body.thinWords) {
    findings.push(
      warning(
        "body.thin",
        `The article is ${stats.words} words. Under ${LIMITS.body.thinWords}, search engines treat a page as thin; add context, a quote, or what happens next.`,
      ),
    );
  }
  if (stats.words > LIMITS.body.subheadsAfterWords && stats.headings === 0) {
    findings.push(
      warning(
        "body.no-subheads",
        `The article is ${stats.words} words with no subheadings. Add Heading 2s so readers can scan it.`,
      ),
    );
  }
  if (stats.internalLinks === 0 && stats.words >= LIMITS.body.thinWords) {
    findings.push(
      warning(
        "body.no-internal-links",
        "Link to at least one related Redshirt Sports article, team page, or author.",
      ),
    );
  }

  let embedRun = 0;
  for (const block of blocks) {
    if (EMBED_TYPES.has(block._type)) {
      embedRun += 1;
      if (embedRun === 3) {
        findings.push(
          warning(
            "body.embed-run",
            "Three embeds in a row. Put a sentence between embeds saying why each matters.",
            block._key,
          ),
        );
      }
    } else if (!(isTextBlock(block) && !blockText(block).trim())) {
      embedRun = 0;
    }
  }
  return findings;
}

export function bodyFindings(body: BodyBlock[] | undefined | null): Finding[] {
  const blocks = body ?? [];
  const hasContent = blocks.some(
    (block) => !isTextBlock(block) || blockText(block).trim().length > 0,
  );
  if (!hasContent) {
    return [error("body.required", "Write the article before publishing.")];
  }
  return [
    ...headingFindings(blocks),
    ...paragraphFindings(blocks),
    ...structureFindings(blocks),
  ];
}
