import type { PortableTextBlock } from "next-sanity";

import {
  getLegalHeadings,
  headingSlug,
  headingTextToSlug,
} from "@/components/legal/headings";

function block(
  key: string,
  style: string,
  ...texts: string[]
): PortableTextBlock {
  return {
    _type: "block",
    _key: key,
    style,
    markDefs: [],
    children: texts.map((text, index) => ({
      _type: "span",
      _key: `${key}-span-${index}`,
      text,
      marks: [],
    })),
  };
}

describe("headingTextToSlug", () => {
  it("lowercases, transliterates, and strips punctuation", () => {
    expect(headingTextToSlug("  Cookies & Analytics (Ünïcode)  ")).toBe(
      "cookies-and-analytics-unicode",
    );
  });

  it("strips invisible characters from draft-mode text", () => {
    expect(headingTextToSlug("Governing\u200b\u200c Law")).toBe(
      "governing-law",
    );
  });
});

describe("headingSlug", () => {
  it("joins spans without separators so marked-up words don't change the slug", () => {
    expect(headingSlug(block("a", "h2", "Your ", "Rights", " Explained"))).toBe(
      headingSlug(block("b", "h2", "Your Rights Explained")),
    );
  });
});

describe("getLegalHeadings", () => {
  it("returns h2 and h3 headings in order", () => {
    const headings = getLegalHeadings([
      block("a", "h2", "Information We Collect"),
      block("b", "normal", "Some paragraph"),
      block("c", "h3", "Cookies & Analytics"),
      block("d", "h4", "Ignored minor heading"),
    ]);

    expect(headings).toEqual([
      {
        id: "information-we-collect",
        text: "Information We Collect",
        level: 2,
      },
      { id: "cookies-and-analytics", text: "Cookies & Analytics", level: 3 },
    ]);
  });

  it("skips non-text blocks", () => {
    expect(
      getLegalHeadings([
        { _type: "image", _key: "img", style: "h2" } as PortableTextBlock,
      ]),
    ).toEqual([]);
  });

  it("returns an empty list when there is no body", () => {
    expect(getLegalHeadings(null)).toEqual([]);
  });
});
