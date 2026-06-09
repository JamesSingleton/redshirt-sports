import { render, screen } from "@testing-library/react";

import ArticleFeed from "@/components/article-feed";
import type { ArticleFeedItem } from "@/types/article";

const testMainImage = {
  caption: "",
  attribution: "",
  _type: "image" as const,
  alt: "Test image",
  credit: "Unknown",
  blurData: null,
  dominantColor: null,
};

vi.mock("@/components/article-card", () => ({
  __esModule: true,
  default: ({
    title,
    imagePriority,
  }: {
    title: string;
    imagePriority?: boolean;
  }) => (
    <div
      data-testid="article-card"
      data-priority={String(imagePriority ?? false)}
    >
      {title}
    </div>
  ),
}));

const articles = [
  {
    _id: "1",
    title: "First Article",
    excerpt: "First excerpt",
    storyType: "news",
    mainImage: testMainImage,
    slug: "first-article",
    publishedAt: "2026-01-01T00:00:00Z",
    authors: [{ name: "Jane Doe" }],
  },
  {
    _id: "2",
    title: "Second Article",
    excerpt: "Second excerpt",
    storyType: "news",
    mainImage: testMainImage,
    slug: "second-article",
    publishedAt: "2026-01-02T00:00:00Z",
    authors: [{ name: "John Smith" }],
  },
] as ArticleFeedItem[];

describe("ArticleFeed", () => {
  it("renders article cards for each article", () => {
    render(<ArticleFeed articles={articles} />);

    expect(screen.getByText("First Article")).toBeInTheDocument();
    expect(screen.getByText("Second Article")).toBeInTheDocument();
    expect(screen.getAllByTestId("article-card")).toHaveLength(2);
  });

  it("prioritizes images for the first four articles", () => {
    const manyArticles = Array.from({ length: 5 }, (_, i) => ({
      _id: String(i),
      title: `Article ${i}`,
      excerpt: `Excerpt ${i}`,
      storyType: "news" as const,
      mainImage: testMainImage,
      slug: `article-${i}`,
      publishedAt: "2026-01-01T00:00:00Z",
      authors: [{ name: "Author" }],
    })) as ArticleFeedItem[];

    render(<ArticleFeed articles={manyArticles} />);

    const cards = screen.getAllByTestId("article-card");
    expect(cards[0]).toHaveAttribute("data-priority", "true");
    expect(cards[3]).toHaveAttribute("data-priority", "true");
    expect(cards[4]).toHaveAttribute("data-priority", "false");
  });
});
