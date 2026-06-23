import { render, screen } from "@testing-library/react";

import ArticleCard from "@/components/article-card";

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
  }: {
    image?: { alt?: string };
    priority?: boolean;
  }) => <img alt={image?.alt ?? "article"} data-priority={String(priority ?? false)} />,
  IMAGE_SIZES: {
    articleCard: "test",
  },
}));

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

describe("ArticleCard", () => {
  it("renders a linked title when slug is a string", () => {
    render(
      <ArticleCard
        title="Big Game Preview"
        image={{ alt: "Stadium" }}
        slug="big-game-preview"
        author="Jane Doe"
        date="2026-01-15T20:00:00.000Z"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Big Game Preview" }),
    ).toHaveAttribute("href", "/big-game-preview");
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("2026-01-15T20:00:00.000Z")).toBeInTheDocument();
  });

  it("renders a linked title when slug is a Sanity slug object", () => {
    render(
      <ArticleCard
        title="Recruiting Update"
        image={null}
        slug={{ _type: "slug", current: "recruiting-update" }}
        author="John Smith"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Recruiting Update" }),
    ).toHaveAttribute("href", "/recruiting-update");
  });

  it("renders an unlinked title when slug is null", () => {
    render(
      <ArticleCard
        title="Draft Article"
        image={null}
        slug={null}
        author="Editor"
      />,
    );

    expect(
      screen.queryByRole("link", { name: "Draft Article" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Draft Article")).toBeInTheDocument();
  });

  it("prioritizes images when imagePriority is enabled", () => {
    render(
      <ArticleCard
        title="Priority Article"
        image={{ alt: "Stadium" }}
        slug="priority-article"
        author="Jane Doe"
        imagePriority
      />,
    );

    expect(screen.getByRole("img")).toHaveAttribute("data-priority", "true");
  });

  it("uses the requested heading level", () => {
    render(
      <ArticleCard
        title="Headline"
        image={null}
        slug="headline"
        author="Writer"
        headingLevel="h2"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Headline" }),
    ).toBeInTheDocument();
  });
});
