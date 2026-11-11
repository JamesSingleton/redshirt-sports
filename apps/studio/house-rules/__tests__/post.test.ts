import { describe, expect, it } from "vitest";

import {
  bylineFindings,
  checkStory,
  correctionFindings,
  coverageFindings,
  faqFindings,
  keyTakeawayFindings,
} from "../post";

const ref = (id: string) => ({ _type: "reference", _ref: id });
const rules = (findings: Array<{ rule: string }>) =>
  findings.map((finding) => finding.rule);

describe("bylineFindings", () => {
  it("requires an author and rejects duplicates and overlap", () => {
    expect(rules(bylineFindings([]))).toEqual(["byline.required"]);
    expect(rules(bylineFindings([ref("a"), ref("a")]))).toEqual([
      "byline.duplicate",
    ]);
    expect(rules(bylineFindings([ref("a")], [ref("a")]))).toEqual([
      "byline.contributor-overlap",
    ]);
    expect(bylineFindings([ref("a"), ref("b")], [ref("c")])).toEqual([]);
  });
});

describe("coverageFindings", () => {
  const base = {
    sport: ref("football"),
    classification: ref("d1"),
    teams: [ref("t1"), ref("t2")],
    tags: [ref("tag")],
  };

  it("passes a fully tagged article", () => {
    expect(coverageFindings(base)).toEqual([]);
  });

  it("blocks a missing sport or level", () => {
    expect(rules(coverageFindings({ ...base, sport: undefined }))).toEqual([
      "coverage.sport",
    ]);
    expect(
      rules(coverageFindings({ ...base, classification: undefined })),
    ).toEqual(["coverage.classification"]);
  });

  it("warns when a game article tags one team", () => {
    expect(
      rules(
        coverageFindings({
          ...base,
          storyType: "game-recap",
          teams: [ref("t1")],
          game: "espn:401|Idaho at Montana",
        }),
      ),
    ).toEqual(["coverage.game-teams"]);
  });

  it("asks game articles to name the game", () => {
    expect(
      rules(coverageFindings({ ...base, storyType: "game-preview" })),
    ).toEqual(["coverage.game"]);
    expect(rules(coverageFindings({ ...base, storyType: "analysis" }))).toEqual(
      [],
    );
  });

  it("checks game and player references", () => {
    expect(
      rules(coverageFindings({ ...base, game: "Montana vs Idaho" })),
    ).toEqual(["coverage.game-format"]);
    expect(
      rules(
        coverageFindings({
          ...base,
          players: ["espn:1|A", "espn:1|A again", "not a ref"],
        }),
      ),
    ).toEqual(["coverage.player-format", "coverage.player-duplicate"]);
    const many = Array.from({ length: 9 }, (_, i) => `espn:${i}|Player ${i}`);
    expect(rules(coverageFindings({ ...base, players: many }))).toEqual([
      "coverage.players-max",
    ]);
  });

  it("blocks too many tags", () => {
    const tags = ["a", "b", "c", "d", "e", "f"].map(ref);
    expect(rules(coverageFindings({ ...base, tags }))).toEqual([
      "coverage.tags-max",
    ]);
  });
});

describe("keyTakeawayFindings", () => {
  it("allows none, blocks one, accepts three", () => {
    const item = "Montana State clinched the top seed in the FCS playoffs.";
    expect(keyTakeawayFindings(undefined)).toEqual([]);
    expect(rules(keyTakeawayFindings([item]))).toEqual(["takeaways.count"]);
    expect(
      keyTakeawayFindings([item, `${item} Again.`, `${item} Once more.`]),
    ).toEqual([]);
  });
});

describe("faqFindings", () => {
  const answer =
    "Twenty-four teams make the FCS playoffs. Ten get automatic bids as conference champions.";

  it("accepts a well-formed pair", () => {
    expect(
      faqFindings([
        { question: "How many teams make the FCS playoffs?", answer },
      ]),
    ).toEqual([]);
  });

  it("blocks a statement, a short answer, and a duplicate", () => {
    expect(
      rules(faqFindings([{ question: "FCS playoff field", answer }])),
    ).toEqual(["faq.question-mark"]);
    expect(
      rules(faqFindings([{ question: "How many teams?", answer: "24." }])),
    ).toEqual(["faq.answer-length"]);
    expect(
      rules(
        faqFindings([
          { question: "How many teams?", answer },
          { question: "how many teams?", answer },
        ]),
      ),
    ).toEqual(["faq.duplicate"]);
  });
});

describe("correctionFindings", () => {
  it("requires text and a date after publication", () => {
    expect(rules(correctionFindings([{ kind: "correction" }]))).toEqual([
      "correction.text",
      "correction.date",
    ]);
    expect(
      rules(
        correctionFindings(
          [{ text: "Fixed the score.", date: "2026-01-01T00:00:00Z" }],
          "2026-02-01T00:00:00Z",
        ),
      ),
    ).toEqual(["correction.before-publish"]);
  });
});

describe("checkStory", () => {
  it("counts errors across every section for an empty article", () => {
    const check = checkStory({});
    expect(check.errors).toBe(5);
    expect(check.sections.map((section) => section.id)).toEqual([
      "headline",
      "byline",
      "image",
      "body",
      "coverage",
      "answers",
      "seo",
      "standards",
    ]);
  });
});
