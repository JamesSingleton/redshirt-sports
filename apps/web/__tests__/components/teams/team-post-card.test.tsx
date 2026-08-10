import { render, screen } from "@testing-library/react";

import {
  getPostSportCategory,
  TeamFeaturedArticle,
  TeamNewsItem,
  TeamRelativeDate,
  TeamSportCategory,
} from "@/components/teams/team-post-card";

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
  default: () => <img alt="post" />,
  IMAGE_SIZES: {
    teamFeatured: "featured",
    teamThumbnail: "thumb",
  },
}));

const post = {
  _id: "post-1",
  title: "Alabama lands five-star recruit",
  slug: "alabama-recruit",
  publishedAt: "2026-01-01T12:00:00.000Z",
  image: { asset: { _ref: "image-1" }, alt: "Recruit" },
  sport: { slug: "football", title: "Football" },
  authors: [{ name: "Jane Doe" }],
} as const;

describe("team-post-card", () => {
  it("returns the default sport category when sport data is missing", () => {
    expect(getPostSportCategory({ ...post, sport: null } as never)).toEqual({
      label: "College News",
      href: "/college/news",
    });
  });

  it("returns the default sport category when the post has no sport field", () => {
    const { sport: _sport, ...postWithoutSport } = post;
    expect(getPostSportCategory(postWithoutSport as never)).toEqual({
      label: "College News",
      href: "/college/news",
    });
  });

  it("returns the default sport category when sport slug is missing", () => {
    expect(
      getPostSportCategory({
        ...post,
        sport: { slug: null, title: "Football" },
      } as never),
    ).toEqual({
      label: "College News",
      href: "/college/news",
    });
  });

  it("renders the sport category link", () => {
    render(<TeamSportCategory post={post as never} />);
    expect(screen.getByRole("link", { name: "Football" })).toHaveAttribute(
      "href",
      "/college/football/news",
    );
  });

  it("renders a featured article with links", () => {
    render(<TeamFeaturedArticle post={post as never} />);
    expect(
      screen.getByRole("link", { name: "Alabama lands five-star recruit" }),
    ).toHaveAttribute("href", "/alabama-recruit");
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders an unlinked featured article when slug is missing", () => {
    render(<TeamFeaturedArticle post={{ ...post, slug: null } as never} />);
    expect(
      screen.queryByRole("link", { name: "Alabama lands five-star recruit" }),
    ).not.toBeInTheDocument();
  });

  it("renders a news list item", () => {
    render(<TeamNewsItem post={post as never} />);
    expect(
      screen.getByRole("link", { name: "Alabama lands five-star recruit" }),
    ).toBeInTheDocument();
  });

  it("renders a placeholder image container when asset is missing", () => {
    render(
      <TeamNewsItem post={{ ...post, image: { alt: "No asset" } } as never} />,
    );
    expect(screen.getByRole("article")).toBeInTheDocument();
  });

  it("renders a news list item without links when slug is missing", () => {
    render(<TeamNewsItem post={{ ...post, slug: null } as never} />);
    expect(
      screen.queryByRole("link", { name: "Alabama lands five-star recruit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Alabama lands five-star recruit"),
    ).toBeInTheDocument();
  });

  it("omits published date when missing", () => {
    render(
      <TeamNewsItem
        post={{ ...post, publishedAt: null, authors: [] } as never}
      />,
    );
    expect(screen.getByText("Redshirt Sports")).toBeInTheDocument();
    expect(screen.queryByText(/ago/i)).not.toBeInTheDocument();
  });

  it("renders a relative published date", () => {
    render(<TeamRelativeDate dateString="2026-01-01T12:00:00.000Z" />);
    expect(screen.getByText(/ago/i)).toBeInTheDocument();
  });
});
