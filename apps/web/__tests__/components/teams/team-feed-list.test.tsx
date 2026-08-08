import { render, screen } from "@testing-library/react";

import { TeamFeedList } from "@/components/teams/team-feed-list";

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

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="feed" />,
  IMAGE_SIZES: { teamThumbnail: "thumb" },
}));

const post = {
  _id: "post-1",
  title: "Team update",
  slug: "team-update",
  publishedAt: "2026-01-01T12:00:00.000Z",
  image: { asset: { _ref: "image-1" }, alt: "Update" },
  sport: { slug: "football", title: "Football" },
  authors: [{ name: "Jane Doe", slug: "jane-doe" }],
};

describe("TeamFeedList", () => {
  it("returns null when there are no posts", () => {
    const { container } = render(
      <TeamFeedList title="Latest" posts={[]} footerLinks={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders feed items, separators, and footer links", () => {
    const { container } = render(
      <TeamFeedList
        title="Latest News"
        posts={[post as never, { ...post, _id: "post-2", slug: null } as never]}
        footerLinks={[{ label: "View all", href: "/college/football/news" }]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Latest News" }),
    ).toBeInTheDocument();
    expect(container.querySelectorAll('[data-ui="feed-article"]')).toHaveLength(
      2,
    );
    expect(
      screen.getAllByRole("link", { name: "Jane Doe" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "View all" })).toHaveAttribute(
      "href",
      "/college/football/news",
    );
  });

  it("renders posts without author links or images", () => {
    render(
      <TeamFeedList
        title="Updates"
        posts={[
          {
            ...post,
            authors: [{ name: "Staff Writer" }],
            image: null,
            publishedAt: null,
          } as never,
        ]}
      />,
    );

    expect(screen.getByText("Staff Writer")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Staff Writer" }),
    ).not.toBeInTheDocument();
  });

  it("renders unlinked titles and thumbnails when slug is missing", () => {
    render(
      <TeamFeedList
        title="Updates"
        posts={[
          {
            ...post,
            slug: null,
            image: { alt: "No asset" },
          } as never,
        ]}
      />,
    );

    expect(screen.getByText("Team update")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Team update" }),
    ).not.toBeInTheDocument();
  });
});
