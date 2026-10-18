import { render, screen } from "@testing-library/react";
import type { StegaBranded } from "next-sanity";

import ArticleSection from "@/components/article-section";

vi.mock("@/components/format-date", () => ({
  __esModule: true,
  default: ({ dateString }: { dateString: string }) => (
    <time dateTime={dateString}>{dateString}</time>
  ),
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="section" />,
  IMAGE_SIZES: {
    articleInline: "test",
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

const articles = [
  {
    _id: "1",
    title: "Lead Story",
    excerpt: "Lead excerpt",
    slug: "lead-story",
    image: { alt: "Lead" },
    publishedAt: "2026-01-15T20:00:00.000Z",
    authors: [
      {
        name: "Jane Doe",
        slug: "jane-doe",
        image: { alt: "Author" },
      },
    ],
  },
  {
    _id: "2",
    title: "Secondary Story",
    excerpt: "Secondary excerpt",
    slug: "secondary-story",
    image: null,
    publishedAt: "2026-01-14T20:00:00.000Z",
    authors: [{ name: "John Smith" }],
  },
] as unknown as StegaBranded<Parameters<typeof ArticleSection>[0]["articles"]>;

describe("ArticleSection", () => {
  it("renders the section title, lead story, and compact stories", () => {
    render(
      <ArticleSection
        title="FBS News"
        slug="/college/football/news/fbs"
        articles={articles}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "FBS News" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Lead Story" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Lead excerpt")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View All/ })).toHaveAttribute(
      "href",
      "/college/football/news/fbs",
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "Secondary Story" }),
    ).toBeInTheDocument();
  });

  it("applies imageFirst ordering classes", () => {
    const { container } = render(
      <ArticleSection
        title="FBS News"
        slug="/college/football/news/fbs"
        articles={articles}
        imageFirst
      />,
    );

    expect(container.querySelector(".lg\\:order-2")).toBeInTheDocument();
  });
});

describe("ArticleSection empty", () => {
  it("renders nothing when there are no articles", () => {
    const { container } = render(
      <ArticleSection
        title="FBS News"
        slug="/college/football/news/fbs"
        articles={[] as unknown as typeof articles}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
