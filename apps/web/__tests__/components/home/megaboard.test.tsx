import { render, screen, within } from "@testing-library/react";

import { Megaboard } from "@/components/home/megaboard";
import type { HomeArticle } from "@/components/home/sections";

vi.mock("@/components/format-date", () => ({
  __esModule: true,
  default: ({ dateString }: { dateString: string }) => (
    <time dateTime={dateString}>{dateString}</time>
  ),
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" />,
}));

function article(
  id: string,
  overrides: Partial<HomeArticle> = {},
): HomeArticle {
  return {
    _id: id,
    title: `Story ${id}`,
    slug: `story-${id}`,
    image: null,
    publishedAt: "2026-01-01",
    authors: [{ name: "Reporter" }],
    ...overrides,
  };
}

describe("Megaboard", () => {
  it("renders nothing without articles", () => {
    const { container } = render(<Megaboard articles={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an h1 lead with h2 side stories by default", () => {
    render(
      <Megaboard
        articles={[
          article("1"),
          article("2"),
          article("3", { publishedAt: null }),
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Story 1" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Reporter")).toBeInTheDocument();
    const list = screen.getByRole("list");
    expect(
      within(list).getByRole("heading", { level: 2, name: "Story 2" }),
    ).toBeInTheDocument();
    expect(within(list).getByRole("link", { name: /Story 2/ })).toHaveAttribute(
      "href",
      "/story-2",
    );
    expect(
      within(list).getAllByRole("listitem")[1]?.querySelector("time"),
    ).toBe(null);
  });

  it("drops side headings to h3 when the lead is an h2", () => {
    render(
      <Megaboard
        articles={[article("1", { authors: null }), article("2")]}
        leadHeadingLevel="h2"
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "Story 1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Story 2" }),
    ).toBeInTheDocument();
  });
});
