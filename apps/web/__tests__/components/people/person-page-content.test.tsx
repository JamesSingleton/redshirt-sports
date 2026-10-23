import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" />,
  IMAGE_SIZES: { articleCard: "144px" },
}));

vi.mock("@/components/pagination-controls", () => ({
  __esModule: true,
  default: () => <nav data-testid="pagination" />,
}));

vi.mock("@/components/most-read-card", () => ({
  MostReadCard: () => <div data-testid="most-read" />,
}));

vi.mock("@/components/news/archive-published-time", () => ({
  ArchivePublishedTime: ({ dateString }: { dateString: string }) => (
    <time>{dateString}</time>
  ),
}));

import { PersonPageContent } from "@/components/people/person-page-content";

const author = {
  name: "Jane Author",
  slug: "jane-author",
  roles: ["Writer", "Editor"],
  biography: "Covers FCS.",
  image: null,
  socialLinks: { twitter: "https://twitter.com/jane" },
};

describe("PersonPageContent", () => {
  it("uses singular article copy for one story", () => {
    render(
      <PersonPageContent
        author={{ ...author, socialLinks: null, biography: null }}
        posts={[
          {
            _id: "post-1",
            title: "Only story",
            slug: "only-story",
          },
        ]}
        totalPosts={1}
        pageIndex={1}
        mostRead={[]}
      />,
    );

    expect(screen.getByText("1 article")).toBeInTheDocument();
    expect(screen.queryByText("Covers FCS.")).not.toBeInTheDocument();
  });

  it("renders staff layout without articles", () => {
    render(
      <PersonPageContent
        author={author}
        posts={[]}
        totalPosts={0}
        pageIndex={1}
        mostRead={[]}
      />,
    );

    expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
    expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
  });

  it("renders articles, voter link, pagination, and sidebar", () => {
    render(
      <PersonPageContent
        author={author}
        posts={[
          {
            _id: "post-1",
            title: "Story title",
            slug: "story-title",
            publishedAt: "2026-01-15",
            image: null,
            division: { name: "FCS" },
            tags: [{ name: "News" }, { name: null }],
          },
        ]}
        totalPosts={13}
        pageIndex={2}
        mostRead={[{ _id: "mr-1", slug: "hot-story", title: "Hot" }]}
        voterBallotHref="/ballots/jane"
        voterBallotLabel="View ballots"
      />,
    );

    expect(screen.getByRole("link", { name: "View ballots" })).toHaveAttribute(
      "href",
      "/ballots/jane",
    );
    expect(screen.getByText("13 articles")).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Story title" })).toHaveAttribute(
      "href",
      "/story-title",
    );
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
    expect(screen.getByTestId("most-read")).toBeInTheDocument();
  });
});
