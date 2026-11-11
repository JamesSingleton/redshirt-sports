import { describe, expect, it } from "vitest";

import { bodyLinkTargetFindings } from "../body";
import {
  isCurrentLink,
  isLegacyLink,
  linkDirection,
  linkTargetFindings,
  ownSitePath,
} from "../links";

const rules = (findings: Array<{ rule: string }>) =>
  findings.map((finding) => finding.rule);

describe("linkTargetFindings", () => {
  it("accepts each kind of complete link", () => {
    expect(
      linkTargetFindings({ linkType: "internal", reference: { _ref: "p" } }),
    ).toEqual([]);
    expect(
      linkTargetFindings({ linkType: "path", path: "/college/teams" }),
    ).toEqual([]);
    expect(
      linkTargetFindings({ linkType: "external", href: "https://ncaa.com" }),
    ).toEqual([]);
    expect(linkTargetFindings(undefined)).toEqual([]);
  });

  it("requires a destination for each kind", () => {
    expect(rules(linkTargetFindings({ linkType: "internal" }))).toEqual([
      "link.reference",
    ]);
    expect(rules(linkTargetFindings({ linkType: "path" }))).toEqual([
      "link.path",
    ]);
    expect(rules(linkTargetFindings({ linkType: "external" }))).toEqual([
      "link.href",
    ]);
    expect(rules(linkTargetFindings({}))).toEqual(["link.type"]);
  });

  it("checks path format", () => {
    expect(
      rules(
        linkTargetFindings({
          linkType: "path",
          path: "https://www.redshirtsports.com/a",
        }),
      ),
    ).toEqual(["link.path-full-url"]);
    expect(
      rules(linkTargetFindings({ linkType: "path", path: "a/b" })),
    ).toEqual(["link.path-format"]);
    expect(
      rules(linkTargetFindings({ linkType: "path", path: "//evil.com" })),
    ).toEqual(["link.path-format"]);
    expect(
      rules(linkTargetFindings({ linkType: "path", path: "/a b" })),
    ).toEqual(["link.path-spaces"]);
  });

  it("blocks our own domain as an external link and warns on http", () => {
    expect(
      rules(
        linkTargetFindings({
          linkType: "external",
          href: "https://www.redshirtsports.com/college/football/news/fcs",
        }),
      ),
    ).toEqual(["link.own-site-external"]);
    const insecure = linkTargetFindings({
      linkType: "external",
      href: "http://example.com",
    });
    expect(insecure[0]).toMatchObject({
      rule: "link.insecure",
      level: "warning",
    });
  });
});

describe("link helpers", () => {
  it("tells current links from legacy ones", () => {
    expect(isCurrentLink({ _key: "a", _type: "link", linkType: "path" })).toBe(
      true,
    );
    expect(isLegacyLink({ _key: "a", _type: "link", href: "https://x" })).toBe(
      true,
    );
    expect(isLegacyLink({ _key: "a", _type: "customLink" })).toBe(true);
    expect(isLegacyLink({ _key: "a", _type: "strong" })).toBe(false);
  });

  it("classifies direction", () => {
    expect(
      linkDirection({ _key: "a", _type: "link", linkType: "external" }),
    ).toBe("external");
    expect(linkDirection({ _key: "a", _type: "link", linkType: "path" })).toBe(
      "internal",
    );
    expect(linkDirection({ _key: "a", _type: "internalLink" })).toBeNull();
  });

  it("extracts the path from our own URLs only", () => {
    expect(ownSitePath("https://redshirtsports.xyz/a?b=1#c")).toBe("/a?b=1#c");
    expect(ownSitePath("https://x.com/_redshirtsports")).toBeNull();
    expect(ownSitePath("not a url")).toBeNull();
  });

  it("locates destination problems on their block", () => {
    const findings = bodyLinkTargetFindings([
      {
        _type: "block",
        _key: "b1",
        markDefs: [{ _key: "m", _type: "link", linkType: "internal" }],
        children: [],
      },
      { _type: "image", _key: "i1" },
    ]);
    expect(findings).toEqual([
      expect.objectContaining({ rule: "link.reference", blockKey: "b1" }),
    ]);
    expect(bodyLinkTargetFindings(undefined)).toEqual([]);
  });
});
