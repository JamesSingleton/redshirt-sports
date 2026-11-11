import { describe, expect, it } from "vitest";

import { LIMITS } from "../limits";
import {
  altTextFindings,
  creditFindings,
  excerptFindings,
  headlineFindings,
  heroImageFindings,
  imageDimensions,
  seoTitleFindings,
  truncateAtWord,
} from "../text";

const rules = (findings: Array<{ rule: string }>) =>
  findings.map((finding) => finding.rule);

describe("headlineFindings", () => {
  it("accepts a normal headline", () => {
    expect(
      headlineFindings(
        "Montana State holds off Montana to win Brawl of the Wild",
      ),
    ).toEqual([]);
  });

  it("requires a headline", () => {
    expect(rules(headlineFindings("  "))).toEqual(["headline.required"]);
  });

  it("blocks headlines over the Top Articles limit", () => {
    const findings = headlineFindings("Montana ".repeat(20).trim());
    expect(findings[0]).toMatchObject({ rule: "headline.max", level: "error" });
  });

  it("warns between the ideal and the limit", () => {
    const title = `${"Word ".repeat(16)}end`;
    expect(title.length).toBeGreaterThan(LIMITS.headline.ideal);
    expect(headlineFindings(title)[0]).toMatchObject({
      rule: "headline.ideal",
      level: "warning",
    });
  });

  it("blocks shouting but allows acronyms", () => {
    expect(
      rules(headlineFindings("MONTANA STATE WINS THE FCS TITLE GAME")),
    ).toContain("headline.caps");
    expect(
      rules(headlineFindings("NDSU beats SDSU for the FCS national title")),
    ).not.toContain("headline.caps");
  });

  it("blocks stray whitespace", () => {
    expect(
      rules(headlineFindings("Montana  beats Idaho in overtime thriller")),
    ).toContain("headline.whitespace");
  });

  it("warns on a label prefix and a trailing period", () => {
    const found = rules(
      headlineFindings("Breaking: Montana hires a new head coach."),
    );
    expect(found).toContain("headline.label");
    expect(found).toContain("headline.period");
  });

  it("applies the style sheet", () => {
    expect(
      rules(headlineFindings("Division 2 playoff bracket revealed for 2026")),
    ).toContain("style.division-numerals");
  });
});

describe("seoTitleFindings", () => {
  const long =
    "A headline that is clearly longer than sixty characters in total length";

  it("is optional when the headline fits", () => {
    expect(seoTitleFindings(undefined, "Short headline that fits")).toEqual([]);
  });

  it("is required when the headline is too long for search", () => {
    expect(rules(seoTitleFindings("", long))).toEqual(["seoTitle.required"]);
  });

  it("blocks an over-length title and the site name", () => {
    expect(rules(seoTitleFindings(long, long))).toContain("seoTitle.max");
    expect(
      rules(seoTitleFindings("FCS playoffs | Redshirt Sports", long)),
    ).toContain("seoTitle.site-name");
  });
});

describe("excerptFindings", () => {
  it("requires a summary", () => {
    expect(rules(excerptFindings(undefined))).toEqual(["excerpt.required"]);
  });

  it("warns outside the ideal range and accepts inside it", () => {
    expect(rules(excerptFindings("x".repeat(80)))).toEqual(["excerpt.ideal"]);
    expect(excerptFindings("x".repeat(140))).toEqual([]);
  });

  it("blocks a summary that repeats the headline", () => {
    const text =
      "Montana beats Idaho in overtime to clinch the Big Sky title outright";
    expect(rules(excerptFindings(text, `${text} `))).toContain(
      "excerpt.repeats-headline",
    );
  });
});

describe("image rules", () => {
  it("requires alt text and rejects file names", () => {
    expect(rules(altTextFindings(""))).toEqual(["alt.required"]);
    expect(rules(altTextFindings("IMG_2041.jpg"))).toContain("alt.filename");
    expect(rules(altTextFindings("Photo of the Montana sideline"))).toContain(
      "alt.prefix",
    );
  });

  it("requires a real credit", () => {
    expect(rules(creditFindings(undefined))).toEqual(["credit.required"]);
    expect(rules(creditFindings("Google"))).toEqual(["credit.vague"]);
    expect(creditFindings("Jane Doe / Montana Athletics")).toEqual([]);
  });

  it("reads dimensions from the asset id", () => {
    expect(imageDimensions("image-abc123-1600x900-jpg")).toEqual({
      width: 1600,
      height: 900,
    });
    expect(imageDimensions("file-abc")).toBeNull();
  });

  it("warns on small or portrait lead images", () => {
    expect(rules(heroImageFindings("image-abc-800x1200-jpg"))).toEqual([
      "image.width",
      "image.portrait",
    ]);
    expect(heroImageFindings("image-abc-1600x900-jpg")).toEqual([]);
  });
});

describe("truncateAtWord", () => {
  it("leaves short text alone", () => {
    expect(truncateAtWord("Short  title ", 60)).toBe("Short title");
  });

  it("cuts on a word boundary and drops a dangling connector", () => {
    const result = truncateAtWord(
      "North Dakota State rolls past South Dakota State and the rest of the Valley",
      60,
    );
    expect(result.length).toBeLessThanOrEqual(60);
    expect(result).toBe("North Dakota State rolls past South Dakota State");
  });
});
