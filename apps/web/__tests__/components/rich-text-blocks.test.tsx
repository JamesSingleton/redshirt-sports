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
vi.mock("@/components/tweet", () => ({ ReactTweet: () => null }));
vi.mock("@/components/youtube-embed", () => ({
  YouTubeEmbedComponent: () => null,
}));
vi.mock("@/components/bracket/bracket-embed", () => ({
  BracketEmbed: () => null,
}));
vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => null,
  IMAGE_SIZES: { articleInline: "test" },
}));

const renderBlocks = (blocks: Array<Record<string, unknown>>) =>
  render(
    <RichText
      richText={blocks.map((block, index) => ({ _key: `k${index}`, ...block }))}
    />,
  );

describe("RichText editorial blocks", () => {
  it("renders a pull quote with its speaker and role", () => {
    renderBlocks([
      {
        _type: "pullQuote",
        quote: "We earned this one.",
        attribution: "Bobby Hauck",
        role: "Montana head coach",
      },
      { _type: "pullQuote", quote: "No speaker." },
      { _type: "pullQuote", quote: "Speaker only.", attribution: "Jane Doe" },
      { _type: "pullQuote" },
    ]);
    expect(screen.getByText("“We earned this one.”")).toBeInTheDocument();
    expect(
      screen.getByText("Bobby Hauck, Montana head coach"),
    ).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getAllByRole("figure")).toHaveLength(3);
  });

  it("renders a callout with its kind label and optional title", () => {
    renderBlocks([
      {
        _type: "callout",
        kind: "numbers",
        title: "The streak",
        text: "Eleven straight wins.",
      },
      { _type: "callout", text: "Background only." },
      { _type: "callout", kind: "update" },
    ]);
    expect(screen.getByText("By the numbers")).toBeInTheDocument();
    expect(screen.getByText("The streak")).toBeInTheDocument();
    expect(screen.getByText("Context")).toBeInTheDocument();
    expect(screen.queryByText("Update")).not.toBeInTheDocument();
  });

  it("renders a related story card and skips an unresolved one", () => {
    renderBlocks([
      {
        _type: "relatedArticle",
        label: "Earlier",
        post: { title: "Griz clinch", slug: "griz-clinch" },
      },
      {
        _type: "relatedArticle",
        post: { title: "Cats respond", slug: "cats-respond" },
      },
      { _type: "relatedArticle", post: { title: "No slug" } },
      { _type: "relatedArticle", post: { slug: "no-title" } },
      { _type: "relatedArticle" },
    ]);
    expect(screen.getByText("Earlier")).toBeInTheDocument();
    expect(screen.getByText("Related")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Griz clinch" })).toHaveAttribute(
      "href",
      "/griz-clinch",
    );
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("renders a social post as a captioned link", () => {
    renderBlocks([
      {
        _type: "socialEmbed",
        url: "https://www.instagram.com/p/abc/",
        caption: "The team celebrates in the locker room.",
      },
      { _type: "socialEmbed", url: "not a url" },
      { _type: "socialEmbed", caption: "No link" },
    ]);
    expect(
      screen.getByText("The team celebrates in the locker room."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View the post on instagram.com" }),
    ).toHaveAttribute("href", "https://www.instagram.com/p/abc/");
    expect(
      screen.getByRole("link", { name: "View the post" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("No link")).not.toBeInTheDocument();
  });
});
