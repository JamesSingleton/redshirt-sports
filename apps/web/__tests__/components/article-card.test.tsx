import { render, screen } from "@testing-library/react";

import ArticleCard, {
  ArticleOverlayCard,
  ArticleRow,
  toSlugPath,
} from "@/components/article-card";

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
  }) => (
    <img
      alt={image?.alt ?? "article"}
      data-priority={String(priority ?? false)}
    />
  ),
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
      screen.getByRole("link", { name: /Big Game Preview/ }),
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
      screen.getByRole("link", { name: /Recruiting Update/ }),
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
      screen.queryByRole("link", { name: /Draft Article/ }),
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

describe("ArticleCard extras", () => {
  it("renders a kicker, a shared-element image and date-only meta", () => {
    const { container } = render(
      <ArticleCard
        id="post-1"
        title="Kicker Story"
        image={{ alt: "Field" }}
        slug="kicker-story"
        date="2026-02-01"
        kicker="SEC"
      />,
    );

    expect(screen.getByText("SEC")).toBeInTheDocument();
    expect(screen.getByText("2026-02-01")).toBeInTheDocument();
    expect(container.querySelector("article p span")).toBeNull();
  });

  it("omits meta when there is no author or date", () => {
    const { container } = render(
      <ArticleCard title="No Meta" image={null} slug="no-meta" />,
    );
    expect(container.querySelector("p")).toBeNull();
  });

  it("treats a slug object without current as unlinked", () => {
    render(
      <ArticleCard
        title="Slugless"
        image={null}
        slug={{ _type: "slug" } as never}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("toSlugPath", () => {
  it("normalizes strings, slug objects and nullish values", () => {
    expect(toSlugPath("a")).toBe("a");
    expect(toSlugPath({ _type: "slug", current: "b" })).toBe("b");
    expect(toSlugPath({ _type: "slug" } as never)).toBeNull();
    expect(toSlugPath(null)).toBeNull();
    expect(toSlugPath(undefined)).toBeNull();
  });
});

describe("ArticleRow", () => {
  it("renders a linked h3 title with meta", () => {
    render(
      <ArticleRow
        id="row-1"
        title="Row Story"
        image={null}
        slug="row-story"
        author="Writer"
        date="2026-03-01"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "Row Story" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Row Story" })).toHaveAttribute(
      "href",
      "/row-story",
    );
    expect(screen.getByText("Writer")).toBeInTheDocument();
  });

  it("renders a plain title at the requested level without a slug", () => {
    render(
      <ArticleRow
        title="Plain Row"
        image={null}
        slug={null}
        headingLevel="h4"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 4, name: "Plain Row" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("ArticleOverlayCard", () => {
  it("renders a linked overlay with kicker, excerpt, author and date", () => {
    render(
      <ArticleOverlayCard
        id="lead-1"
        title="Lead Story"
        excerpt="The excerpt"
        image={{ alt: "Hero" }}
        imagePriority
        slug="lead-story"
        author="Reporter"
        date="2026-04-01"
        kicker="Big Ten"
        headingLevel="h1"
        sizes="100vw"
        className="extra"
        imageClassName="aspect-square"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Lead Story" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/lead-story");
    expect(screen.getByText("Big Ten")).toBeInTheDocument();
    expect(screen.getByText("The excerpt")).toBeInTheDocument();
    expect(screen.getByText("Reporter")).toBeInTheDocument();
    expect(screen.getByText("2026-04-01")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("data-priority", "true");
  });

  it("renders an unlinked h2 overlay with only a date", () => {
    render(
      <ArticleOverlayCard
        title="Date Only"
        image={null}
        slug={null}
        date="2026-05-01"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Date Only" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("2026-05-01")).toBeInTheDocument();
  });

  it("renders only the author when there is no date, and no meta when neither", () => {
    const { rerender, container } = render(
      <ArticleOverlayCard
        title="Author Only"
        image={null}
        slug="author-only"
        author="Solo"
      />,
    );
    expect(screen.getByText("Solo")).toBeInTheDocument();
    expect(container.querySelector("time")).toBeNull();

    rerender(<ArticleOverlayCard title="Bare" image={null} slug="bare" />);
    expect(container.querySelector("p")).toBeNull();
  });
});
