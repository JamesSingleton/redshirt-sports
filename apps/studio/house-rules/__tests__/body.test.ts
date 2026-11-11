import { describe, expect, it } from "vitest";

import { bodyFindings, bodyStats, normalizedHeadingStyles } from "../body";
import type { BodyBlock, MarkDef } from "../types";

let key = 0;
const nextKey = () => `k${++key}`;

const block = (
  text: string,
  style = "normal",
  extra: { markDefs?: MarkDef[]; marks?: string[] } = {},
): BodyBlock => ({
  _type: "block",
  _key: nextKey(),
  style,
  markDefs: extra.markDefs ?? [],
  children: [
    { _type: "span", _key: nextKey(), text, marks: extra.marks ?? [] },
  ],
});

const words = (count: number) =>
  Array.from({ length: count }, (_, index) => `word${index}`).join(" ");

const internalLink: MarkDef = {
  _key: "in1",
  _type: "link",
  linkType: "path",
  path: "/a",
};

const rules = (body: BodyBlock[]) => bodyFindings(body).map((f) => f.rule);

/** A body long enough, and linked, so only the rule under test fires. */
const healthy = (...extra: BodyBlock[]): BodyBlock[] => [
  block(words(30), "normal", { markDefs: [internalLink], marks: ["in1"] }),
  ...extra,
  block(words(100)),
  block(words(100)),
];

describe("bodyFindings", () => {
  it("requires a body", () => {
    expect(rules([])).toEqual(["body.required"]);
    expect(rules([block("   ")])).toEqual(["body.required"]);
  });

  it("passes a well-formed article", () => {
    expect(
      rules(healthy(block("What it means", "h2"), block(words(40)))),
    ).toEqual([]);
  });

  it("blocks a first heading that isn't an h2", () => {
    expect(rules(healthy(block("Section", "h3")))).toContain(
      "body.first-heading",
    );
  });

  it("blocks a skipped heading level", () => {
    const found = bodyFindings(
      healthy(block("Section", "h2"), block(words(20)), block("Deep", "h4")),
    ).find((finding) => finding.rule === "body.heading-skip");
    expect(found?.level).toBe("error");
    expect(found?.blockKey).toBeDefined();
  });

  it("blocks legacy links and warns on vague link text", () => {
    const legacy = block("read this", "normal", {
      markDefs: [{ _key: "l1", _type: "link", href: "https://example.com" }],
      marks: ["l1"],
    });
    const vague = block("here", "normal", {
      markDefs: [{ ...internalLink, _key: "v1" }],
      marks: ["v1"],
    });
    const found = rules(healthy(legacy, vague));
    expect(found).toContain("link.legacy");
    expect(found).toContain("link.vague-text");
  });

  it("warns on thin articles, long paragraphs, and missing internal links", () => {
    expect(rules([block(words(40))])).toContain("body.thin");
    expect(rules(healthy(block(words(200))))).toContain("body.long-paragraph");
    expect(rules([block(words(200))])).toContain("body.no-internal-links");
  });

  it("warns when the article doesn't open with a paragraph", () => {
    expect(rules([block("Section", "h2"), ...healthy()])).toContain(
      "body.lede-first",
    );
  });

  it("warns on three embeds in a row", () => {
    const embed = (): BodyBlock => ({
      _type: "twitter",
      _key: nextKey(),
      id: "1",
    });
    expect(rules(healthy(embed(), embed(), embed()))).toContain(
      "body.embed-run",
    );
    expect(
      rules(healthy(embed(), embed(), block(words(10)), embed())),
    ).not.toContain("body.embed-run");
  });

  it("applies the style sheet to body copy", () => {
    expect(rules(healthy(block("The Big 10 added two teams.")))).toContain(
      "style.big-ten",
    );
  });
});

describe("bodyStats", () => {
  it("counts words, links, and embeds", () => {
    const stats = bodyStats([
      ...healthy(),
      { _type: "image", _key: nextKey() },
      { _type: "youtubeEmbed", _key: nextKey() },
    ]);
    expect(stats.words).toBe(230);
    expect(stats.readingMinutes).toBe(1);
    expect(stats.internalLinks).toBe(1);
    expect(stats.images).toBe(1);
    expect(stats.embeds).toBe(1);
    expect(stats.ledeWords).toBe(30);
  });
});

describe("normalizedHeadingStyles", () => {
  it("repairs the outline without touching valid headings", () => {
    const body = [
      block("a", "h3"),
      block("b", "h5"),
      block("c", "h2"),
      block("d", "h4"),
      block("e", "h6"),
    ];
    const changes = normalizedHeadingStyles(body);
    const result = body.map(
      (b) => changes.get(b._key) ?? (b as { style: string }).style,
    );
    expect(result).toEqual(["h2", "h3", "h2", "h3", "h4"]);
  });

  it("returns nothing for a valid outline", () => {
    expect(
      normalizedHeadingStyles([
        block("a", "h2"),
        block("b", "h3"),
        block("c", "h2"),
      ]).size,
    ).toBe(0);
  });
});
