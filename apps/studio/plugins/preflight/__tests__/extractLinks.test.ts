import { describe, expect, it } from "vitest";

import { extractLinks } from "../checks/dead-links/extractLinks";

describe("extractLinks", () => {
  it("extracts external customLink marks from block content", () => {
    const body = [
      {
        _key: "block1",
        _type: "block",
        children: [
          {
            _key: "span1",
            _type: "span",
            marks: ["link1"],
            text: "Read more",
          },
        ],
        markDefs: [
          {
            _key: "link1",
            _type: "customLink",
            customLink: {
              _type: "customUrl",
              type: "external",
              external: "https://example.com/article",
            },
          },
        ],
        style: "normal",
      },
    ];

    const findings = extractLinks(body);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      id: "https://example.com/article",
      url: "https://example.com/article",
      label: "Read more",
      source: "customLink",
    });
  });

  it("extracts legacy link and internalLink marks", () => {
    const body = [
      {
        _key: "block1",
        _type: "block",
        children: [
          {
            _key: "span1",
            _type: "span",
            marks: ["external"],
            text: "External",
          },
          {
            _key: "span2",
            _type: "span",
            marks: ["internal"],
            text: "Internal",
          },
        ],
        markDefs: [
          {
            _key: "external",
            _type: "link",
            href: "https://example.org",
          },
          {
            _key: "internal",
            _type: "internalLink",
            reference: { _ref: "post-123", _type: "reference" },
          },
        ],
        style: "normal",
      },
    ];

    const findings = extractLinks(body);

    expect(findings).toHaveLength(2);
    expect(
      findings.find((finding) => finding.source === "legacyLink"),
    ).toMatchObject({
      url: "https://example.org",
      label: "External",
    });
    expect(
      findings.find((finding) => finding.source === "internalLink"),
    ).toMatchObject({
      refId: "post-123",
      label: "Internal",
    });
  });

  it("extracts internal custom paths and sport news archive links for resolution", () => {
    const body = [
      {
        _key: "block1",
        _type: "block",
        children: [
          {
            _key: "span1",
            _type: "span",
            marks: ["customPath"],
            text: "About",
          },
          {
            _key: "span2",
            _type: "span",
            marks: ["sportNews"],
            text: "Football news",
          },
        ],
        markDefs: [
          {
            _key: "customPath",
            _type: "customLink",
            customLink: {
              _type: "customUrl",
              type: "internal",
              internalType: "custom",
              internalUrl: "/about",
            },
          },
          {
            _key: "sportNews",
            _type: "customLink",
            customLink: {
              _type: "customUrl",
              type: "internal",
              internalType: "sportNews",
              sportNewsLink: {
                sport: { _ref: "sport-football" },
                routeDepth: "sportNews",
              },
            },
          },
        ],
        style: "normal",
      },
    ];

    const findings = extractLinks(body);

    expect(findings).toHaveLength(2);
    expect(findings.find((finding) => finding.url === "/about")).toBeDefined();
    expect(
      findings.find(
        (finding) => finding.customUrl?.internalType === "sportNews",
      ),
    ).toMatchObject({
      source: "customLink",
      customUrl: {
        internalType: "sportNews",
      },
    });
  });

  it("finds links inside nested list blocks", () => {
    const body = [
      {
        _key: "list1",
        _type: "block",
        children: [
          {
            _key: "item1",
            _type: "span",
            marks: ["list-item"],
            text: "",
          },
        ],
        level: 1,
        listItem: "bullet",
        style: "normal",
      },
      {
        _key: "block1",
        _type: "block",
        children: [
          {
            _key: "span1",
            _type: "span",
            marks: ["list-item", "link1"],
            text: "Nested link",
          },
        ],
        level: 1,
        listItem: "bullet",
        markDefs: [
          {
            _key: "link1",
            _type: "link",
            href: "https://nested.example.com",
          },
        ],
        style: "normal",
      },
    ];

    const findings = extractLinks(body);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.url).toBe("https://nested.example.com");
  });

  it("deduplicates identical URLs", () => {
    const body = [
      {
        _key: "block1",
        _type: "block",
        children: [
          {
            _key: "span1",
            _type: "span",
            marks: ["link1"],
            text: "First",
          },
        ],
        markDefs: [
          {
            _key: "link1",
            _type: "link",
            href: "https://duplicate.example.com",
          },
        ],
        style: "normal",
      },
      {
        _key: "block2",
        _type: "block",
        children: [
          {
            _key: "span2",
            _type: "span",
            marks: ["link2"],
            text: "Second",
          },
        ],
        markDefs: [
          {
            _key: "link2",
            _type: "link",
            href: "https://duplicate.example.com",
          },
        ],
        style: "normal",
      },
    ];

    const findings = extractLinks(body);

    expect(findings).toHaveLength(1);
  });

  it("surfaces incomplete links as warnings instead of ignoring them", () => {
    const body = [
      {
        _key: "block1",
        _type: "block",
        children: [
          {
            _key: "span1",
            _type: "span",
            marks: ["link1"],
            text: "Broken link",
          },
        ],
        markDefs: [
          {
            _key: "link1",
            _type: "customLink",
          },
        ],
        style: "normal",
      },
      {
        _key: "block2",
        _type: "block",
        children: [
          {
            _key: "span2",
            _type: "span",
            marks: ["link2"],
            text: "Legacy missing href",
          },
        ],
        markDefs: [
          {
            _key: "link2",
            _type: "link",
          },
        ],
        style: "normal",
      },
    ];

    const findings = extractLinks(body);

    expect(findings).toHaveLength(2);
    expect(findings.every((finding) => finding.incomplete)).toBe(true);
  });

  it("extracts YouTube embed URLs", () => {
    const body = [
      {
        _key: "yt1",
        _type: "youtubeEmbed",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ];

    const findings = extractLinks(body);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      source: "youtube",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });
  });

  it("skips mailto, tel, and hash-only links", () => {
    const body = [
      {
        _key: "block1",
        _type: "block",
        children: [
          {
            _key: "span1",
            _type: "span",
            marks: ["link1", "link2", "link3"],
            text: "Contact",
          },
        ],
        markDefs: [
          { _key: "link1", _type: "link", href: "mailto:hello@example.com" },
          { _key: "link2", _type: "link", href: "tel:+15555550100" },
          { _key: "link3", _type: "link", href: "#section" },
        ],
        style: "normal",
      },
    ];

    expect(extractLinks(body)).toHaveLength(0);
  });
});
