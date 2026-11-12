import { evaluate, parse } from "groq-js";
import { describe, expect, it } from "vitest";

import { HEALTH_CHECKS } from "../health-checks";

/** The ids of the documents a check's filter matches, run as real GROQ. */
async function matches(id: string, dataset: Record<string, unknown>[]) {
  const check = HEALTH_CHECKS.find((entry) => entry.id === id);
  if (!check) throw new Error(`No health check ${id}`);
  const result = await evaluate(parse(`*[${check.filter}]._id`), { dataset });
  return (await result.get()) as string[];
}

const block = (markDefs?: Record<string, unknown>[]) => ({
  _type: "block",
  _key: "b",
  children: [{ _type: "span", _key: "s", text: "Text", marks: [] }],
  ...(markDefs && { markDefs }),
});
const photo = { _type: "image", _key: "p", asset: { _ref: "image-1" } };

describe("old-links health check", () => {
  it("counts only legacy link annotations", async () => {
    const dataset = [
      {
        _id: "current",
        _type: "post",
        body: [
          block([
            {
              _type: "link",
              _key: "l",
              linkType: "external",
              href: "https://x.com",
            },
          ]),
          photo,
        ],
      },
      { _id: "photo-only", _type: "post", body: [block([]), photo, block()] },
      {
        _id: "internal-link",
        _type: "post",
        body: [block([{ _type: "internalLink", _key: "l" }])],
      },
      {
        _id: "custom-link",
        _type: "post",
        body: [photo, block([{ _type: "customLink", _key: "l" }])],
      },
      {
        _id: "untyped-link",
        _type: "post",
        body: [block([{ _type: "link", _key: "l", href: "/x" }])],
      },
      {
        _id: "custom-url",
        _type: "post",
        body: [block([{ _type: "link", _key: "l", customUrl: "/x" }])],
      },
      { _id: "no-body", _type: "post" },
    ];

    expect((await matches("old-links", dataset)).sort()).toEqual([
      "custom-link",
      "custom-url",
      "internal-link",
      "untyped-link",
    ]);
  });
});

describe("other health checks", () => {
  it("find what their titles say", async () => {
    const dataset = [
      {
        _id: "complete",
        _type: "post",
        sport: { _ref: "s" },
        classification: { _ref: "c" },
        image: { alt: "Alt" },
        title: "Short",
        teams: ["t"],
        tags: ["g"],
      },
      { _id: "bare", _type: "post", title: "A".repeat(80) },
      { _id: "conf", _type: "conference" },
      { _id: "school", _type: "school", conferenceAffiliations: [] },
    ];

    expect(await matches("no-sport-or-level", dataset)).toEqual(["bare"]);
    expect(await matches("no-alt", dataset)).toEqual(["bare"]);
    expect(await matches("long-headline-no-seo-title", dataset)).toEqual([
      "bare",
    ]);
    expect(await matches("no-teams", dataset)).toEqual(["bare"]);
    expect(await matches("no-tags", dataset)).toEqual(["bare"]);
    expect(await matches("conference-no-level", dataset)).toEqual(["conf"]);
    expect(await matches("school-no-conference", dataset)).toEqual(["school"]);
  });
});

describe("health check types", () => {
  it("name the type their filter lists, so the list sorts as that type", () => {
    for (const check of HEALTH_CHECKS) {
      expect(check.filter.startsWith(`_type == "${check.type}"`)).toBe(true);
    }
  });
});
