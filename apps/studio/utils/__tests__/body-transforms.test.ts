import { describe, expect, it } from "vitest";

import type { BodyBlock, MarkDef } from "@/house-rules/types";
import {
  captionToAlt,
  changedBlocks,
  convertLegacyLink,
  convertLegacyLinks,
  type LinkLookup,
  moveInlineCaptionsToAlt,
  normalizeBody,
} from "../body-transforms";

const block = (
  key: string,
  markDefs: MarkDef[],
  marks: string[],
  style = "normal",
): BodyBlock => ({
  _type: "block",
  _key: key,
  style,
  markDefs,
  children: [{ _type: "span", _key: `${key}s`, text: "text", marks }],
});

const lookup: LinkLookup = {
  typeOf: (id) =>
    ({ "post-1": "post", "school-1": "school", "conf-1": "conference" })[id],
  newsPath: (id, sport) =>
    id === "conf-1" ? `/college/${sport ?? "football"}/news/fcs/big-sky` : null,
  sportNewsPath: () => "/college/football/news/fcs",
};

describe("convertLegacyLink", () => {
  it("keeps an outside link external and its new-tab choice", () => {
    expect(
      convertLegacyLink(
        { _key: "a", _type: "link", href: "https://ncaa.com/x", blank: false },
        lookup,
      ),
    ).toEqual({
      _type: "link",
      _key: "a",
      linkType: "external",
      href: "https://ncaa.com/x",
      openInNewTab: false,
    });
  });

  it("turns our own URLs and relative paths into paths", () => {
    expect(
      convertLegacyLink(
        {
          _key: "a",
          _type: "link",
          href: "https://www.redshirtsports.com/college/football/news/fcs?page=2",
        },
        lookup,
      ),
    ).toMatchObject({
      linkType: "path",
      path: "/college/football/news/fcs?page=2",
    });
    expect(
      convertLegacyLink({ _key: "a", _type: "link", href: "/about" }, lookup),
    ).toMatchObject({ linkType: "path", path: "/about" });
  });

  it("keeps a page reference as a reference", () => {
    expect(
      convertLegacyLink(
        {
          _key: "a",
          _type: "internalLink",
          reference: { _type: "reference", _ref: "post-1" },
        },
        lookup,
      ),
    ).toMatchObject({
      linkType: "internal",
      reference: { _type: "reference", _ref: "post-1", _weak: true },
    });
  });

  it("turns a conference reference into its news page", () => {
    expect(
      convertLegacyLink(
        {
          _key: "a",
          _type: "internalLink",
          reference: { _type: "reference", _ref: "conf-1" },
        },
        lookup,
        "mens-basketball",
      ),
    ).toMatchObject({
      linkType: "path",
      path: "/college/mens-basketball/news/fcs/big-sky",
    });
  });

  it("unwraps customLink and flat customUrl marks", () => {
    expect(
      convertLegacyLink(
        {
          _key: "a",
          _type: "customLink",
          customLink: {
            type: "internal",
            internal: { _type: "reference", _ref: "school-1" },
          },
        },
        lookup,
      ),
    ).toMatchObject({ linkType: "internal", reference: { _ref: "school-1" } });
    expect(
      convertLegacyLink(
        {
          _key: "a",
          _type: "customUrl",
          type: "internal",
          internalType: "custom",
          internalUrl: "/college/teams",
        },
        lookup,
      ),
    ).toMatchObject({ linkType: "path", path: "/college/teams" });
    expect(
      convertLegacyLink(
        {
          _key: "a",
          _type: "customLink",
          customLink: { type: "internal", internalType: "sportNews" },
        },
        lookup,
      ),
    ).toMatchObject({ linkType: "path", path: "/college/football/news/fcs" });
  });

  it("returns null for a link that points nowhere", () => {
    expect(convertLegacyLink({ _key: "a", _type: "link" }, lookup)).toBeNull();
    expect(
      convertLegacyLink({ _key: "a", _type: "internalLink" }, lookup),
    ).toBeNull();
    expect(
      convertLegacyLink(
        {
          _key: "a",
          _type: "internalLink",
          reference: { _type: "reference", _ref: "missing" },
        },
        lookup,
      ),
    ).toBeNull();
  });

  it("leaves a current link alone", () => {
    const current = {
      _key: "a",
      _type: "link",
      linkType: "path",
      path: "/x",
    };
    expect(convertLegacyLink(current, lookup)).toBe(current);
  });
});

describe("convertLegacyLinks", () => {
  it("rewrites marks in place and keeps their keys", () => {
    const body = [
      block(
        "b1",
        [{ _key: "m1", _type: "link", href: "https://x.com" }],
        ["m1"],
      ),
    ];
    const [result] = convertLegacyLinks(body, lookup) as Array<{
      markDefs: MarkDef[];
    }>;
    expect(result.markDefs[0]).toMatchObject({
      _key: "m1",
      _type: "link",
      linkType: "external",
    });
  });

  it("removes a dead link and its mark from the text", () => {
    const body = [
      block("b1", [{ _key: "m1", _type: "link" }], ["m1", "strong"]),
    ];
    const [result] = convertLegacyLinks(body, lookup) as Array<{
      markDefs: MarkDef[];
      children: Array<{ marks: string[] }>;
    }>;
    expect(result.markDefs).toEqual([]);
    expect(result.children[0].marks).toEqual(["strong"]);
  });

  it("returns the same array when every link is current", () => {
    const body = [
      block(
        "b1",
        [{ _key: "m1", _type: "link", linkType: "path", path: "/a" }],
        ["m1"],
      ),
    ];
    expect(convertLegacyLinks(body, lookup)).toBe(body);
  });
});

describe("normalizeBody", () => {
  it("fixes heading levels and strips unsupported decorators", () => {
    const body = [
      block("h", [], [], "h5"),
      block(
        "p",
        [{ _key: "m1", _type: "link", linkType: "path", path: "/a" }],
        ["underline", "em", "m1"],
      ),
    ];
    const result = normalizeBody(body) as Array<{
      style: string;
      children: Array<{ marks: string[] }>;
    }>;
    expect(result[0].style).toBe("h2");
    expect(result[1].children[0].marks).toEqual(["em", "m1"]);
  });

  it("returns the same array for a clean body", () => {
    const body = [block("h", [], [], "h2"), block("p", [], ["strong"])];
    expect(normalizeBody(body)).toBe(body);
  });
});

describe("captions", () => {
  it("moves a caption into alt and drops it", () => {
    expect(captionToAlt({ caption: "Fans storm the field" })).toEqual({
      alt: "Fans storm the field",
    });
    expect(captionToAlt({ caption: "old", alt: "kept" })).toEqual({
      alt: "kept",
    });
    expect(captionToAlt({ caption: "  " })).toEqual({});
    const clean = { alt: "x" };
    expect(captionToAlt(clean)).toBe(clean);
  });

  it("rewrites only inline photos that still have a caption", () => {
    const body: BodyBlock[] = [
      { _type: "image", _key: "i1", caption: "Fans storm the field" },
      { _type: "image", _key: "i2", alt: "kept" },
      block("p", [], []),
    ];
    const result = moveInlineCaptionsToAlt(body);
    expect(result[0]).toEqual({
      _type: "image",
      _key: "i1",
      alt: "Fans storm the field",
    });
    expect(result[1]).toBe(body[1]);
    expect(changedBlocks(body, result).map((b) => b._key)).toEqual(["i1"]);
    expect(moveInlineCaptionsToAlt([body[1]])).toEqual([body[1]]);
  });
});
