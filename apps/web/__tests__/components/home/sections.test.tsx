import { render, screen, within } from "@testing-library/react";

import {
  FeatureSection,
  GridSection,
  type HomeArticle,
  LeadListSection,
  SplitSection,
} from "@/components/home/sections";

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
    authors: [{ name: `Author ${id}` }],
    conferences: [{ shortName: `C${id}`, name: `Conference ${id}` }],
    ...overrides,
  };
}

const frame = {
  id: "section-fcs",
  title: "FCS football",
  href: "/college/football/news/fcs",
};

function articles(count: number) {
  return Array.from({ length: count }, (_, index) =>
    article(String(index + 1)),
  );
}

describe("GridSection", () => {
  it("renders nothing without articles", () => {
    const { container } = render(<GridSection {...frame} articles={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a labelled two-column grid with a description and badge", () => {
    const { container } = render(
      <GridSection
        {...frame}
        badge="New"
        description="Football Championship Subdivision"
        articles={articles(2)}
      />,
    );

    expect(
      screen.getByRole("region", { name: "FCS football" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Football Championship Subdivision"),
    ).toBeInTheDocument();
    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.getByText("C1")).toBeInTheDocument();
    expect(container.querySelector(".sm\\:grid-cols-2")).not.toBeNull();
  });

  it("supports a three-column grid and conference/author fallbacks", () => {
    const { container } = render(
      <GridSection
        {...frame}
        columns={3}
        articles={[
          article("a", { conferences: [{ shortName: null, name: "Big Sky" }] }),
          article("b", { conferences: [{ shortName: null, name: null }] }),
          article("c", { conferences: null, authors: null }),
        ]}
      />,
    );

    expect(container.querySelector(".md\\:grid-cols-3")).not.toBeNull();
    expect(screen.getByText("Big Sky")).toBeInTheDocument();
    expect(screen.queryByText("Author c")).not.toBeInTheDocument();
  });
});

describe("FeatureSection", () => {
  it("renders nothing without a lead", () => {
    const { container } = render(<FeatureSection {...frame} articles={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders only the overlay lead when there is one article", () => {
    render(<FeatureSection {...frame} articles={articles(1)} />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Story 1" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders the lead, two cards and a row list", () => {
    render(<FeatureSection {...frame} articles={articles(5)} />);

    const list = screen.getByRole("list");
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((item) => within(item).getByRole("heading").textContent),
    ).toEqual(["Story 4", "Story 5"]);
    expect(
      screen.getByRole("heading", { name: "Story 2" }),
    ).toBeInTheDocument();
  });
});

describe("SplitSection", () => {
  it("renders nothing without articles", () => {
    const { container } = render(<SplitSection {...frame} articles={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders two cards over a list of the rest", () => {
    render(<SplitSection {...frame} articles={articles(3)} />);

    expect(
      within(screen.getByRole("list")).getAllByRole("listitem"),
    ).toHaveLength(1);
  });
});

describe("LeadListSection", () => {
  it("renders nothing without a lead", () => {
    const { container } = render(<LeadListSection {...frame} articles={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a lead story beside the remaining rows", () => {
    render(<LeadListSection {...frame} articles={articles(3)} />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Story 1" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("list")).getAllByRole("listitem"),
    ).toHaveLength(2);
  });
});
