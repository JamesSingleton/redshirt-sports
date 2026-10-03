import { type PortableTextBlock, stegaClean, toPlainText } from "next-sanity";
import slugify from "slugify";

export type LegalHeading = {
  id: string;
  text: string;
  level: 2 | 3;
};

const HEADING_LEVELS = { h2: 2, h3: 3 } as const;

export function headingTextToSlug(text: string): string {
  return slugify(text.trim(), { lower: true, remove: /[^a-zA-Z0-9 ]/g });
}

/**
 * The single source of truth for heading anchors: the body renderer uses it for
 * each heading's `id` and the table of contents for its `#hash` links.
 * `toPlainText` joins a block's spans without separators, so bolded or linked
 * words inside a heading don't change the slug.
 */
export function headingSlug(block: PortableTextBlock): string {
  return headingTextToSlug(toPlainText(block));
}

export function getLegalHeadings(
  body: PortableTextBlock[] | null | undefined,
): LegalHeading[] {
  if (!body) return [];

  return body.flatMap((block) => {
    const level = HEADING_LEVELS[block.style as keyof typeof HEADING_LEVELS];
    if (block._type !== "block" || !level) return [];

    return [
      {
        id: headingSlug(block),
        text: stegaClean(toPlainText(block)).trim(),
        level,
      },
    ];
  });
}
