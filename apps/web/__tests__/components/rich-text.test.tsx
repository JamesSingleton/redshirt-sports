import { render, screen } from "@testing-library/react";

import { RichText } from "@/components/rich-text";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/tweet", () => ({
  ReactTweet: ({ id }: { id: string }) => <div data-testid="tweet">{id}</div>,
}));

vi.mock("@/components/youtube-embed", () => ({
  YouTubeEmbedComponent: ({ url }: { url: string }) => (
    <div data-testid="youtube">{url}</div>
  ),
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: ({ image }: { image?: { alt?: string } }) => (
    <img alt={image?.alt ?? "inline"} />
  ),
  IMAGE_SIZES: { articleInline: "test" },
}));

const richText = [
  {
    _type: "block",
    style: "h2",
    children: [{ _type: "span", text: "Heading Two" }],
  },
  {
    _type: "block",
    style: "h3",
    children: [{ _type: "span", text: "Heading Three" }],
  },
  {
    _type: "block",
    style: "h4",
    children: [{ _type: "span", text: "Heading Four" }],
  },
  {
    _type: "block",
    style: "h5",
    children: [{ _type: "span", text: "Heading Five" }],
  },
  {
    _type: "block",
    style: "h6",
    children: [{ _type: "span", text: "Heading Six" }],
  },
  {
    _type: "block",
    style: "normal",
    markDefs: [
      { _key: "internal", _type: "internalLink", href: "/internal" },
      {
        _key: "blank",
        _type: "link",
        href: "https://external.com",
        blank: true,
      },
      {
        _key: "same",
        _type: "link",
        href: "https://same-tab.com",
        blank: false,
      },
      {
        _key: "custom",
        _type: "customLink",
        href: "/custom",
        openInNewTab: true,
      },
      { _key: "custom-same", _type: "customUrl", href: "/custom-same" },
      { _key: "missing", _type: "customLink" },
    ],
    children: [
      {
        _type: "span",
        text: "internal ",
        marks: ["internal"],
      },
      {
        _type: "span",
        text: "blank ",
        marks: ["blank"],
      },
      {
        _type: "span",
        text: "same ",
        marks: ["same"],
      },
      {
        _type: "span",
        text: "custom ",
        marks: ["custom"],
      },
      {
        _type: "span",
        text: "custom-same ",
        marks: ["custom-same"],
      },
      {
        _type: "span",
        text: "missing ",
        marks: ["missing"],
      },
    ],
  },
  {
    _type: "twitter",
    id: "tweet-1",
  },
  {
    _type: "image",
    alt: "Inline image",
    credit: "Getty",
  },
  {
    _type: "image",
    alt: "Attributed image",
    attribution: "AP",
  },
  {
    _type: "table",
    _key: "table-1",
    rows: [
      {
        _key: "header",
        _type: "tableRow",
        cells: ["Team", "Rank"],
      },
      {
        _key: "row-1",
        _type: "tableRow",
        cells: ["Alabama", "1"],
      },
    ],
  },
  {
    _type: "youtubeEmbed",
    url: "https://www.youtube.com/watch?v=abc",
  },
  {
    _type: "unknown",
    _key: "missing",
  },
] as const;

describe("RichText", () => {
  it("returns null when rich text is missing", () => {
    const { container } = render(<RichText richText={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders blocks, marks, embeds, and tables", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    render(<RichText richText={richText} className="custom-prose" />);

    expect(screen.getByRole("heading", { level: 2, name: "Heading Two" }));
    expect(screen.getByRole("heading", { level: 6, name: "Heading Six" }));
    expect(screen.getByRole("link", { name: "internal" })).toHaveAttribute(
      "href",
      "/internal",
    );
    expect(
      screen.getByRole("link", {
        name: "Opens https://external.com in a new tab",
      }),
    ).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "same" })).toHaveAttribute(
      "href",
      "https://same-tab.com",
    );
    expect(screen.getByRole("link", { name: "custom" })).toHaveAttribute(
      "href",
      "/custom",
    );
    expect(screen.getByRole("link", { name: "custom-same" })).toHaveAttribute(
      "href",
      "/custom-same",
    );
    expect(screen.getByText("missing")).toBeInTheDocument();
    expect(screen.getByTestId("tweet")).toHaveTextContent("tweet-1");
    expect(screen.getByText("Source: Getty")).toBeInTheDocument();
    expect(screen.getByText("Source: AP")).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Team" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("youtube")).toHaveTextContent("abc");
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("renders native Portable Text tables with headerRows and cell marks", () => {
    const ptTable = [
      {
        _type: "table",
        _key: "pt-table-1",
        headerRows: 1,
        rows: [
          {
            _key: "h1",
            cells: [
              {
                _key: "c1",
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
                        text: "School",
                        marks: ["strong"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            _key: "r1",
            cells: [
              {
                _key: "c2",
                value: [
                  {
                    _type: "block",
                    _key: "b2",
                    style: "normal",
                    markDefs: [],
                    children: [
                      {
                        _type: "span",
                        _key: "s2",
                        text: "Montana",
                        marks: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    render(<RichText richText={ptTable} />);
    expect(
      screen.getByRole("columnheader", { name: "School" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Montana")).toBeInTheDocument();
  });

  it("skips null holes in native table rows and cells", () => {
    const ptTable = [
      {
        _type: "table",
        _key: "pt-table-holes",
        headerRows: 0,
        rows: [
          null,
          {
            _key: "r1",
            cells: [
              null,
              {
                _key: "c1",
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
                        text: "Present",
                        marks: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    render(<RichText richText={ptTable} />);
    expect(screen.getByText("Present")).toBeInTheDocument();
  });

  it("renders nothing for empty or all-null native table rows", () => {
    const { container: emptyContainer } = render(
      <RichText
        richText={[
          {
            _type: "table",
            _key: "empty",
            rows: [],
          },
        ]}
      />,
    );
    expect(emptyContainer.querySelector("table")).toBeNull();

    const { container: nullRowsContainer } = render(
      <RichText
        richText={[
          {
            _type: "table",
            _key: "null-rows",
            rows: [null, null],
          },
        ]}
      />,
    );
    expect(nullRowsContainer.querySelector("table")).toBeNull();
  });

  it("covers empty cells, missing cell values, and nullish headerRows", () => {
    render(
      <RichText
        richText={[
          {
            _type: "table",
            _key: "edge-native",
            rows: [
              {
                _key: "r1",
                cells: null,
              },
              {
                _key: "r2",
                cells: [
                  { _key: "c-empty", value: null },
                  {
                    _key: "c-text",
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
                            text: "Cell",
                            marks: [],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ]}
      />,
    );
    expect(screen.getByText("Cell")).toBeInTheDocument();
  });

  it("synthesizes keys for native table rows and cells that omit _key", () => {
    render(
      <RichText
        richText={[
          {
            _type: "table",
            _key: "missing-keys",
            headerRows: 1,
            rows: [
              {
                cells: [
                  {
                    value: [
                      {
                        _type: "block",
                        _key: "b-head",
                        style: "normal",
                        markDefs: [],
                        children: [
                          {
                            _type: "span",
                            _key: "s-head",
                            text: "Head",
                            marks: [],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                cells: [
                  {
                    value: [
                      {
                        _type: "block",
                        _key: "b-body",
                        style: "normal",
                        markDefs: [],
                        children: [
                          {
                            _type: "span",
                            _key: "s-body",
                            text: "Body",
                            marks: [],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ]}
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: "Head" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("covers legacy tables with null cells and rows", () => {
    render(
      <RichText
        richText={[
          {
            _type: "table",
            _key: "legacy-nulls",
            rows: [
              null,
              {
                _key: "h1",
                cells: [null, "Header"],
              },
              {
                _key: "b1",
                cells: null as unknown as string[],
              },
              {
                _key: "b2",
                cells: [null, "Body"],
              },
            ],
          },
        ]}
      />,
    );
    expect(
      screen.getByRole("columnheader", { name: "Header" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("renders an empty legacy table when rows lack keys", () => {
    const { container } = render(
      <RichText
        richText={[
          {
            _type: "table",
            _key: "legacy-no-keys",
            rows: [
              null,
              {
                cells: ["Ghost"],
              },
            ],
          },
        ]}
      />,
    );
    expect(container.querySelector("table")).not.toBeNull();
    expect(screen.queryByText("Ghost")).not.toBeInTheDocument();
  });
});
