import { render, screen } from "@testing-library/react";

import { NewsListing } from "@/components/news/news-listing";
import { perPage } from "@/lib/constants";

vi.mock("@/components/article-card", () => ({
  __esModule: true,
  default: ({
    title,
    author,
    imagePriority,
  }: {
    title: string;
    author: string | null;
    imagePriority: boolean;
  }) => (
    <article
      data-testid="card"
      data-author={author ?? ""}
      data-priority={String(imagePriority)}
    >
      {title}
    </article>
  ),
  ArticleOverlayCard: ({
    title,
    author,
  }: {
    title: string;
    author: string | null;
  }) => (
    <article data-testid="overlay" data-author={author ?? ""}>
      {title}
    </article>
  ),
}));

vi.mock("@/components/pagination-controls", () => ({
  __esModule: true,
  default: ({ totalPosts }: { totalPosts: number }) => (
    <nav data-testid="pagination" data-total={totalPosts} />
  ),
}));

function makePost(id: string, authors: unknown[] | null = [{ name: "Ann" }]) {
  return {
    _id: id,
    title: `Post ${id}`,
    slug: id,
    publishedAt: "2026-01-01",
    image: null,
    excerpt: null,
    authors,
  };
}

describe("NewsListing.Feed", () => {
  it("leads with an overlay story on the first page and paginates", () => {
    render(
      <NewsListing.Feed
        posts={[makePost("1"), makePost("2"), makePost("3")]}
        totalPosts={perPage * 2}
        pageIndex={1}
      />,
    );

    expect(screen.getByTestId("overlay")).toHaveTextContent("Post 1");
    expect(screen.getByTestId("overlay")).toHaveAttribute("data-author", "Ann");
    const cards = screen.getAllByTestId("card");
    expect(cards.map((card) => card.textContent)).toEqual(["Post 2", "Post 3"]);
    expect(cards[0]).toHaveAttribute("data-priority", "false");
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("skips the lead story on later pages and prioritizes the first two cards", () => {
    render(
      <NewsListing.Feed
        posts={[makePost("1"), makePost("2"), makePost("3")]}
        totalPosts={3}
        pageIndex={2}
      />,
    );

    expect(screen.queryByTestId("overlay")).not.toBeInTheDocument();
    const cards = screen.getAllByTestId("card");
    expect(cards.map((card) => card.getAttribute("data-priority"))).toEqual([
      "true",
      "true",
      "false",
    ]);
    expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
  });

  it("renders no lead or grid when the first page is empty", () => {
    render(<NewsListing.Feed posts={[]} totalPosts={0} pageIndex={1} />);

    expect(screen.queryByTestId("overlay")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card")).not.toBeInTheDocument();
  });
});

describe("NewsListing.Grid", () => {
  it("resolves author names only from objects with a name", () => {
    render(
      <NewsListing.Grid
        posts={[
          makePost("a"),
          makePost("b", null),
          makePost("c", ["Just a string"]),
          makePost("d", [{ slug: "nameless" }]),
          makePost("e", [null]),
        ]}
        totalPosts={5}
      />,
    );

    expect(
      screen.getAllByTestId("card").map((card) => card.dataset.author),
    ).toEqual(["Ann", "", "", "", ""]);
  });
});

describe("NewsListing.Layout", () => {
  it("renders the main column and aside", () => {
    render(
      <NewsListing.Layout aside={<p>Sidebar</p>}>
        <p>Main</p>
      </NewsListing.Layout>,
    );

    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByRole("complementary")).toHaveTextContent("Sidebar");
  });
});
