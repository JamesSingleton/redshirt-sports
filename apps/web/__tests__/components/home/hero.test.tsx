import type { QueryHomePageDataResult } from "@redshirt-sports/sanity/types";
import { render, screen } from "@testing-library/react";
import type { StegaBranded } from "next-sanity";

import Hero from "@/components/home/hero";

vi.mock("@/components/format-date", () => ({
  __esModule: true,
  default: ({ dateString }: { dateString: string }) => (
    <time dateTime={dateString}>{dateString}</time>
  ),
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="hero" />,
  IMAGE_SIZES: {
    homeHero: "test",
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

const heroPosts = [
  {
    _id: "hero-1",
    _type: "post" as const,
    title: "Hero Story",
    excerpt: "Lead story excerpt",
    slug: "hero-story",
    image: { alt: "Hero image" },
    publishedAt: "2026-01-15T20:00:00.000Z",
    authors: [
      {
        _id: "author-1",
        _type: "author" as const,
        name: "Jane Doe",
        slug: "jane-doe",
        image: { alt: "Author" },
      },
    ],
  },
  {
    _id: "hero-2",
    _type: "post" as const,
    title: "Secondary Story",
    excerpt: "Another excerpt",
    slug: "secondary-story",
    image: { alt: "Secondary image" },
    publishedAt: "2026-01-14T20:00:00.000Z",
    authors: [
      {
        _id: "author-2",
        _type: "author" as const,
        name: "John Smith",
        slug: "john-smith",
        image: { alt: "Author" },
      },
    ],
  },
];

describe("Hero", () => {
  it("renders the lead story and top stories rail", () => {
    render(
      <Hero
        heroPosts={
          heroPosts as unknown as StegaBranded<QueryHomePageDataResult>
        }
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Hero Story" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Lead story excerpt")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Jane Doe/ })).toHaveAttribute(
      "href",
      "/authors/jane-doe",
    );
    expect(screen.getByText("Top stories")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Secondary Story" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Secondary Story" })).toHaveAttribute(
      "href",
      "/secondary-story",
    );
  });

  it("renders nothing when there are no hero posts", () => {
    const { container } = render(
      <Hero heroPosts={[] as unknown as StegaBranded<QueryHomePageDataResult>} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("omits the top stories rail when only the lead story exists", () => {
    render(
      <Hero
        heroPosts={
          [heroPosts[0]] as unknown as StegaBranded<QueryHomePageDataResult>
        }
      />,
    );
    expect(screen.queryByText("Top stories")).not.toBeInTheDocument();
  });
});
