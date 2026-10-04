import { render, screen } from "@testing-library/react";

import { LeadStory, type LeadStoryPost } from "@/components/news/lead-story";

vi.mock("@/components/format-date", () => ({
  __esModule: true,
  default: ({ dateString }: { dateString: string }) => (
    <time dateTime={dateString}>{dateString}</time>
  ),
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: ({
    image,
    priority,
    sizes,
  }: {
    image?: { alt?: string } | null;
    priority?: boolean;
    sizes?: string;
  }) => (
    <img
      alt={image?.alt ?? ""}
      data-priority={String(priority ?? false)}
      data-sizes={sizes}
    />
  ),
}));

const post: LeadStoryPost = {
  _id: "post-1",
  title: "Lead Headline",
  excerpt: "Lead excerpt",
  slug: "lead-headline",
  image: { alt: "Hero" } as never,
  publishedAt: "2026-01-01",
  authors: [
    {
      name: "Jane Writer",
      slug: "jane-writer",
      image: { alt: "Jane" } as never,
    },
  ],
};

describe("LeadStory", () => {
  it("renders a linked h2 story with excerpt, author avatar and date", () => {
    render(<LeadStory post={post} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Lead Headline" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Lead Headline/ })).toHaveAttribute(
      "href",
      "/lead-headline",
    );
    expect(screen.getByText("Lead excerpt")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Jane Writer/ })).toHaveAttribute(
      "href",
      "/authors/jane-writer",
    );
    expect(screen.getByRole("img", { name: "Jane" })).toBeInTheDocument();
    expect(screen.getByText("2026-01-01")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Hero" })).toHaveAttribute(
      "data-priority",
      "false",
    );
  });

  it("supports custom heading level, priority, sizes and heading class", () => {
    render(
      <LeadStory
        post={post}
        headingLevel="h1"
        priority
        sizes="50vw"
        headingClassName="text-2xl"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Lead Headline" }),
    ).toHaveClass("text-2xl");
    expect(screen.getByRole("img", { name: "Hero" })).toHaveAttribute(
      "data-priority",
      "true",
    );
    expect(screen.getByRole("img", { name: "Hero" })).toHaveAttribute(
      "data-sizes",
      "50vw",
    );
  });

  it("renders an author without an avatar", () => {
    render(
      <LeadStory
        post={{ ...post, authors: [{ name: "No Avatar", slug: "no-avatar" }] }}
      />,
    );

    expect(screen.getByRole("link", { name: "No Avatar" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Jane" })).not.toBeInTheDocument();
  });

  it("renders an unlinked story without excerpt, author or date", () => {
    render(
      <LeadStory
        post={{
          ...post,
          slug: null,
          excerpt: null,
          publishedAt: null,
          authors: null,
        }}
        headingLevel="h3"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Lead Headline" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("Lead excerpt")).not.toBeInTheDocument();
    expect(screen.queryByRole("time")).not.toBeInTheDocument();
  });

  it("skips the byline when the first author has no name", () => {
    render(<LeadStory post={{ ...post, authors: [{ name: null }] }} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
