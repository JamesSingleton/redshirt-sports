import { render, screen } from "@testing-library/react";

import { FilterRow } from "@/components/news/filter-row";

describe("FilterRow", () => {
  it("renders nothing without items", () => {
    const { container } = render(<FilterRow label="Sports" items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("links every item and marks the active one", () => {
    render(
      <FilterRow
        label="Sports"
        activeHref="/college/football/news"
        items={[
          { key: "all", label: "All", href: "/college/news" },
          {
            key: "football",
            label: "Football",
            href: "/college/football/news",
          },
        ]}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Sports" })).toBeVisible();
    expect(screen.getByRole("link", { name: "All" })).not.toHaveAttribute(
      "aria-current",
    );
    const active = screen.getByRole("link", { name: "Football" });
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active).toHaveAttribute("href", "/college/football/news");
  });
});
