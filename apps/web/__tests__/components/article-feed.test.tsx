import { render, screen } from "@testing-library/react";

import ArticleFeed from "@/components/article-feed";

vi.mock("@/components/article-card", () => ({
  __esModule: true,
  default: ({
    title,
    imagePriority,
  }: {
    title: string;
    imagePriority?: boolean;
  }) => (
    <div data-testid="article-card" data-priority={String(imagePriority ?? false)}>
      {title}
    </div>
  ),
}));

const articles = [
  {
    _id: "1",
    title: "First Article",
    mainImage: null,
    slug: "first-article",
    publishedAt: "2026-01-01T00:00:00Z",
    authors: [{ name: "Jane Doe" }],
  },
  {
    _id: "2",
    title: "Second Article",
    mainImage: null,
    slug: "second-article",
    publishedAt: "2026-01-02T00:00:00Z",
    authors: [{ name: "John Smith" }],
  },
];

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
      mainImage: null,
      slug: `article-${i}`,
      publishedAt: "2026-01-01T00:00:00Z",
      authors: [{ name: "Author" }],
    }));

    render(<ArticleFeed articles={manyArticles} />);

    const cards = screen.getAllByTestId("article-card");
    expect(cards[0]).toHaveAttribute("data-priority", "true");
    expect(cards[3]).toHaveAttribute("data-priority", "true");
    expect(cards[4]).toHaveAttribute("data-priority", "false");
  });
});
