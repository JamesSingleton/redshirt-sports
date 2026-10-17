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

function cell(text: string, markDefs: Array<Record<string, unknown>> = []) {
  return {
    _key: `c-${text}`,
    _type: "cell",
    value: [paragraph(text, markDefs)],
  };
}

function row(key: string, cells?: Array<Record<string, unknown>>) {
  return { _key: key, _type: "row", ...(cells ? { cells } : {}) };
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

  describe("tables", () => {
    it("renders headerRows in thead and the rest in tbody", () => {
      const html = render([
        {
          _type: "table",
          _key: "t1",
          headerRows: 1,
          rows: [
            row("r1", [cell("Team"), cell("W-L")]),
            row("r2", [cell("A&M"), cell("5-0")]),
          ],
        },
      ]);
      expect(html).toBe(
        "<table><thead><tr><th><p>Team</p></th><th><p>W-L</p></th></tr></thead>" +
          "<tbody><tr><td><p>A&amp;M</p></td><td><p>5-0</p></td></tr></tbody></table>",
      );
    });

    it("supports multiple header rows", () => {
      const html = render([
        {
          _type: "table",
          _key: "t1",
          headerRows: 2,
          rows: [
            row("r1", [cell("H1")]),
            row("r2", [cell("H2")]),
            row("r3", [cell("Body")]),
          ],
        },
      ]);
      expect(html).toBe(
        "<table><thead><tr><th><p>H1</p></th></tr><tr><th><p>H2</p></th></tr></thead>" +
          "<tbody><tr><td><p>Body</p></td></tr></tbody></table>",
      );
    });

    it.each([undefined, 0])(
      "omits thead when headerRows is %s",
      (headerRows) => {
        const html = render([
          {
            _type: "table",
            _key: "t1",
            headerRows,
            rows: [row("r1", [cell("Only")])],
          },
        ]);
        expect(html).toBe(
          "<table><tbody><tr><td><p>Only</p></td></tr></tbody></table>",
        );
      },
    );

    it("renders marks inside cells", () => {
      const html = render([
        {
          _type: "table",
          _key: "t1",
          headerRows: 0,
          rows: [
            row("r1", [
              {
                _key: "c1",
                _type: "cell",
                value: [
                  {
                    _type: "block",
                    _key: "b1",
                    style: "normal",
                    markDefs: [],
                    children: [
                      {
                        _type: "span",
                        _key: "s1",
                        text: "1.47 M*",
                        marks: ["strong"],
                      },
                    ],
                  },
                ],
              },
            ]),
          ],
        },
      ]);
      expect(html).toContain("<td><p><strong>1.47 M*</strong></p></td>");
    });

    it("renders links inside cells as absolute URLs", () => {
      const html = render([
        {
          _type: "table",
          _key: "t1",
          headerRows: 0,
          rows: [
            row("r1", [
              cell("Recap", [{ _type: "link", _key: "m1", href: "/recap" }]),
            ]),
          ],
        },
      ]);
      expect(html).toContain(
        '<td><p><a href="https://www.redshirtsports.com/recap">Recap</a></p></td>',
      );
    });

    it("renders empty rows and cells without a value", () => {
      const html = render([
        {
          _type: "table",
          _key: "t1",
          headerRows: 0,
          rows: [row("r1"), row("r2", [{ _key: "c1", _type: "cell" }])],
        },
      ]);
      expect(html).toBe(
        "<table><tbody><tr></tr><tr><td></td></tr></tbody></table>",
      );
    });

    it("skips tables without rows", () => {
      expect(render([{ _type: "table", _key: "t1" }])).toBe("");
      expect(render([{ _type: "table", _key: "t2", rows: [] }])).toBe("");
    });
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
