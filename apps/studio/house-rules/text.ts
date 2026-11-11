import { LIMITS, SITE_NAME } from "./limits";
import { HEADLINE_LABEL_PREFIX, styleFindingsFor } from "./style-guide";
import { error, type Finding, warning } from "./types";

const letters = (text: string) => text.replace(/[^A-Za-z]/g, "");

/** True when the text is shouted: mostly capitals and long enough to matter. */
export function isAllCaps(text: string): boolean {
  const alpha = letters(text);
  if (alpha.length < 12) return false;
  const upper = alpha.replace(/[^A-Z]/g, "").length;
  return upper / alpha.length > 0.8;
}

export function hasWhitespaceProblem(text: string): boolean {
  return text !== text.trim() || /\s{2,}/.test(text);
}

/** Trim the ends and collapse runs of whitespace to one space. */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Cut text to `max` characters on a word boundary, without an ellipsis, and
 * without leaving a dangling connector ("... wins the", "... Kansas and").
 */
export function truncateAtWord(text: string, max: number): string {
  const clean = normalizeWhitespace(text);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(" ");
  let result = (lastSpace > 0 ? cut.slice(0, lastSpace) : cut.slice(0, max))
    .replace(/[\s,;:\-–—]+$/, "")
    .trim();
  const dangling =
    /\s(?:a|an|the|and|or|but|of|to|in|on|at|for|with|as|vs\.?|by|from|after|before|over|into|than|amid|its|their|his|her)$/i;
  while (dangling.test(result)) {
    result = result
      .replace(dangling, "")
      .replace(/[\s,;:\-–—]+$/, "")
      .trim();
  }
  return result;
}

export function headlineFindings(title: string | undefined | null): Finding[] {
  if (!title?.trim()) {
    return [error("headline.required", "Every article needs a headline.")];
  }
  const findings: Finding[] = [];
  const length = title.length;

  if (length > LIMITS.headline.max) {
    findings.push(
      error(
        "headline.max",
        `Headline is ${length} characters. Keep it to ${LIMITS.headline.max} or fewer: Google rejects longer headlines for Top Articles.`,
      ),
    );
  } else if (length > LIMITS.headline.ideal) {
    findings.push(
      warning(
        "headline.ideal",
        `Headline is ${length} characters. Past ${LIMITS.headline.ideal} it gets cut off in search results and social cards, so add a shorter SEO title.`,
      ),
    );
  } else if (length < LIMITS.headline.min) {
    findings.push(
      warning(
        "headline.short",
        `Headline is only ${length} characters. Name the team or person and say what happened.`,
      ),
    );
  }

  if (hasWhitespaceProblem(title)) {
    findings.push(
      error(
        "headline.whitespace",
        "Remove the extra spaces at the start, end, or between words of the headline.",
      ),
    );
  }
  if (isAllCaps(title)) {
    findings.push(
      error(
        "headline.caps",
        "Don't write the headline in all capitals. Capitalize acronyms only (FCS, NCAA).",
      ),
    );
  }
  if (/[.]$/.test(title.trim()) && !/\.\.\.$/.test(title.trim())) {
    findings.push(
      warning("headline.period", "Headlines don't end with a period."),
    );
  }
  if (HEADLINE_LABEL_PREFIX.test(title)) {
    findings.push(
      warning(
        "headline.label",
        'Drop the label at the start ("Breaking:", "Opinion:"). The article type already tells readers what this is.',
      ),
    );
  }
  if (title.includes(SITE_NAME)) {
    findings.push(
      warning(
        "headline.site-name",
        `Leave "${SITE_NAME}" out of the headline. The site adds it to the page title.`,
      ),
    );
  }
  for (const hit of styleFindingsFor(title)) {
    findings.push(warning(`style.${hit.id}`, hit.advice));
  }
  return findings;
}

export function seoTitleFindings(
  seoTitle: string | undefined | null,
  headline: string | undefined | null,
): Finding[] {
  const findings: Finding[] = [];
  const value = seoTitle?.trim() ?? "";
  const headlineLength = headline?.trim().length ?? 0;

  if (!value) {
    if (headlineLength > LIMITS.seoTitle.max) {
      findings.push(
        error(
          "seoTitle.required",
          `The headline is ${headlineLength} characters, so search results would cut it off. Write an SEO title of ${LIMITS.seoTitle.max} characters or fewer.`,
        ),
      );
    }
    return findings;
  }
  if (value.length > LIMITS.seoTitle.max) {
    findings.push(
      error(
        "seoTitle.max",
        `SEO title is ${value.length} characters. Keep it to ${LIMITS.seoTitle.max} or fewer (the site adds " | ${SITE_NAME}").`,
      ),
    );
  }
  if (value.toLowerCase().includes(SITE_NAME.toLowerCase())) {
    findings.push(
      error(
        "seoTitle.site-name",
        `Remove "${SITE_NAME}" from the SEO title. The site adds it automatically, so it would appear twice.`,
      ),
    );
  }
  if (isAllCaps(value)) {
    findings.push(
      error("seoTitle.caps", "Don't write the SEO title in all capitals."),
    );
  }
  return findings;
}

export function seoDescriptionFindings(
  description: string | undefined | null,
): Finding[] {
  const value = description?.trim() ?? "";
  if (!value) return [];
  if (value.length > LIMITS.seoDescription.max) {
    return [
      error(
        "seoDescription.max",
        `SEO description is ${value.length} characters. Keep it to ${LIMITS.seoDescription.max} or fewer so search results show all of it.`,
      ),
    ];
  }
  return [];
}

export function excerptFindings(
  excerpt: string | undefined | null,
  headline?: string | null,
): Finding[] {
  const value = excerpt?.trim() ?? "";
  if (!value) {
    return [
      error(
        "excerpt.required",
        "Add a summary. It is generated from the body a few seconds after you start writing; clear it to regenerate.",
      ),
    ];
  }
  const { min, max, idealMin, idealMax } = LIMITS.excerpt;
  const findings: Finding[] = [];
  if (value.length < min) {
    findings.push(
      error(
        "excerpt.min",
        `Summary is ${value.length} characters. Write at least ${min}: it is the text under the headline on cards and in search results.`,
      ),
    );
  } else if (value.length > max) {
    findings.push(
      error(
        "excerpt.max",
        `Summary is ${value.length} characters. Keep it to ${max} or fewer.`,
      ),
    );
  } else if (value.length < idealMin || value.length > idealMax) {
    findings.push(
      warning(
        "excerpt.ideal",
        `Summary is ${value.length} characters. ${idealMin} to ${idealMax} reads best in search results.`,
      ),
    );
  }
  if (
    headline &&
    normalizeWhitespace(value).toLowerCase() ===
      normalizeWhitespace(headline).toLowerCase()
  ) {
    findings.push(
      error(
        "excerpt.repeats-headline",
        "The summary repeats the headline. Add what the headline leaves out.",
      ),
    );
  }
  return findings;
}

export function altTextFindings(alt: string | undefined | null): Finding[] {
  const value = alt?.trim() ?? "";
  if (!value) {
    return [
      error(
        "alt.required",
        "Describe the image for readers who can't see it: who is in it and what they are doing.",
      ),
    ];
  }
  const findings: Finding[] = [];
  if (value.length > LIMITS.altText.max) {
    findings.push(
      warning(
        "alt.max",
        `Alt text is ${value.length} characters. Screen readers handle ${LIMITS.altText.max} or fewer best; describe what matters and stop.`,
      ),
    );
  }
  if (/^(?:image|photo|picture|graphic)\s+of\b/i.test(value)) {
    findings.push(
      warning(
        "alt.prefix",
        'Skip "Image of" or "Photo of". Screen readers already announce that it is an image.',
      ),
    );
  }
  if (/\.(?:jpe?g|png|webp|gif|avif)$/i.test(value)) {
    findings.push(
      error("alt.filename", "Alt text is a file name. Describe the image."),
    );
  }
  return findings;
}

export function creditFindings(credit: string | undefined | null): Finding[] {
  const value = credit?.trim() ?? "";
  if (!value) {
    return [
      error(
        "credit.required",
        'Credit the photographer or source, e.g. "Jane Doe / Montana Athletics". We only publish images we have the right to use.',
      ),
    ];
  }
  if (/^(?:google|internet|twitter|x|online|unknown|n\/?a)$/i.test(value)) {
    return [
      error(
        "credit.vague",
        `"${value}" is not a credit. Name the photographer, school, or agency that owns the image.`,
      ),
    ];
  }
  return [];
}

/**
 * Width and height encoded in a Sanity image asset id
 * (`image-<hash>-<width>x<height>-<format>`).
 */
export function imageDimensions(
  assetRef: string | undefined | null,
): { width: number; height: number } | null {
  const match = assetRef?.match(/-(\d+)x(\d+)-[a-z0-9]+$/i);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

export function heroImageFindings(
  assetRef: string | undefined | null,
): Finding[] {
  const size = imageDimensions(assetRef);
  if (!size) return [];
  const findings: Finding[] = [];
  if (size.width < LIMITS.heroImage.minWidth) {
    findings.push(
      warning(
        "image.width",
        `Image is ${size.width}px wide. Use ${LIMITS.heroImage.minWidth}px or wider so Google Discover and social cards can show it large.`,
      ),
    );
  }
  if (size.height > size.width) {
    findings.push(
      warning(
        "image.portrait",
        "The lead image is portrait. Cards and social previews crop to landscape, so set the hotspot or pick a wider shot.",
      ),
    );
  }
  return findings;
}

export const hasErrors = (findings: Finding[]) =>
  findings.some((finding) => finding.level === "error");
