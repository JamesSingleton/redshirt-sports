import type { RssFeedQueryResult } from "@redshirt-sports/sanity/types";

const { mockUrlForJpeg } = vi.hoisted(() => ({
  mockUrlForJpeg: vi.fn(() => ({
    width: () => ({
      quality: () => ({ url: () => "https://cdn.sanity.io/images/inline.jpg" }),
    }),
  })),
}));

vi.mock("@redshirt-sports/sanity/client", () => ({
  urlForJpeg: mockUrlForJpeg,
}));

import { portableTextToHtml, toAbsoluteUrl } from "@/lib/portable-text-to-html";

type Body = RssFeedQueryResult[number]["body"];

const baseUrl = "https://www.redshirtsports.com";

function paragraph(
  text: string,
  markDefs: Array<Record<string, unknown>> = [],
): Body[number] {
  return {
    _type: "block",
    _key: `b-${text}`,
    style: "normal",
    markDefs: markDefs as never,
    children: [
      {
        _type: "span",
        _key: `s-${text}`,
        text,
        marks: markDefs.map((def) => def._key as string),
      },
    ],
  };
}

function render(body: Array<Record<string, unknown>>) {
  return portableTextToHtml(body as Body, baseUrl);
}

describe("toAbsoluteUrl", () => {
  it("resolves site-relative paths against the base URL", () => {
    expect(toAbsoluteUrl("/some-article", baseUrl)).toBe(
      "https://www.redshirtsports.com/some-article",
    );
  });

  it("keeps absolute URLs as-is", () => {
    expect(toAbsoluteUrl("https://espn.com/x", baseUrl)).toBe(
      "https://espn.com/x",
    );
  });

  it("rejects unsafe schemes", () => {
    expect(toAbsoluteUrl("javascript:alert(1)", baseUrl)).toBeNull();
  });

  it("rejects URLs that cannot be parsed", () => {
    expect(toAbsoluteUrl("http://[bad", baseUrl)).toBeNull();
  });
});

describe("portableTextToHtml", () => {
  beforeEach(() => {
    mockUrlForJpeg.mockClear();
  });

  it("renders text blocks and escapes their content", () => {
    expect(render([paragraph("Tigers & Bulldogs <3")])).toBe(
      "<p>Tigers &amp; Bulldogs &lt;3</p>",
    );
  });

  it.each(["customLink", "customUrl", "internalLink", "link"])(
    "renders %s marks as absolute links",
    (markType) => {
      const html = render([
        paragraph("Read more", [
          { _type: markType, _key: "m1", href: "/other-story" },
        ]),
      ]);
      expect(html).toBe(
        '<p><a href="https://www.redshirtsports.com/other-story">Read more</a></p>',
      );
    },
  );

  it("renders link text without an anchor when the href is missing or unsafe", () => {
    const html = render([
      paragraph("No href", [{ _type: "link", _key: "m1" }]),
      paragraph("Unsafe", [
        { _type: "link", _key: "m2", href: "javascript:alert(1)" },
      ]),
    ]);
    expect(html).toBe("<p>No href</p><p>Unsafe</p>");
  });

  it("renders images with a credit caption", () => {
    const html = render([
      {
        _type: "image",
        _key: "i1",
        asset: { _ref: "image-abc-100x100-jpg", _type: "reference" },
        alt: 'Coach "Smith"',
        credit: "AP Photo",
        attribution: "Fallback",
      },
    ]);
    expect(mockUrlForJpeg).toHaveBeenCalled();
    expect(html).toBe(
      '<figure><img src="https://cdn.sanity.io/images/inline.jpg" alt="Coach &quot;Smith&quot;" /><figcaption>Source: AP Photo</figcaption></figure>',
    );
  });

  it("falls back to attribution and omits the caption when there is no credit", () => {
    const base = {
      _type: "image",
      asset: { _ref: "image-abc-100x100-jpg", _type: "reference" },
      alt: "Alt",
    };
    expect(
      render([
        { ...base, _key: "i1", credit: null, attribution: "Team photo" },
      ]),
    ).toContain("<figcaption>Source: Team photo</figcaption>");
    expect(render([{ ...base, _key: "i2", credit: null }])).not.toContain(
      "figcaption",
    );
  });

  it("skips images without an asset", () => {
    expect(render([{ _type: "image", _key: "i1", alt: "Alt" }])).toBe("");
  });

  it("renders tables with the first row as the header", () => {
    const html = render([
      {
        _type: "table",
        _key: "t1",
        rows: [
          { _key: "r1", _type: "tableRow", cells: ["Team", "W-L"] },
          { _key: "r2", _type: "tableRow", cells: ["A&M", "5-0"] },
          { _key: "r3", _type: "tableRow" },
        ],
      },
    ]);
    expect(html).toBe(
      "<table><thead><tr><th>Team</th><th>W-L</th></tr></thead><tbody><tr><td>A&amp;M</td><td>5-0</td></tr><tr></tr></tbody></table>",
    );
  });

  it("skips tables without rows", () => {
    expect(render([{ _type: "table", _key: "t1" }])).toBe("");
  });

  it("renders tweets as links to the post", () => {
    expect(render([{ _type: "twitter", _key: "x1", id: "12345" }])).toBe(
      '<p><a href="https://x.com/i/status/12345">View post on X</a></p>',
    );
    expect(render([{ _type: "twitter", _key: "x2" }])).toBe("");
  });

  it("renders YouTube embeds as links and skips unsafe URLs", () => {
    expect(
      render([
        {
          _type: "youtubeEmbed",
          _key: "y1",
          url: "https://youtube.com/watch?v=abc",
        },
      ]),
    ).toBe(
      '<p><a href="https://youtube.com/watch?v=abc">Watch on YouTube</a></p>',
    );
    expect(
      render([
        { _type: "youtubeEmbed", _key: "y2", url: "javascript:alert(1)" },
      ]),
    ).toBe("");
  });
});
