import { render, screen } from "@testing-library/react";

import { SectionHeader } from "@/components/news/section-header";

describe("SectionHeader", () => {
  it("renders the heading with a badge, extra children and a view-all link", () => {
    render(
      <SectionHeader
        id="fcs-heading"
        title="FCS football"
        href="/college/football/news/fcs"
        badge="Live"
        as="h3"
      >
        <span>Extra</span>
      </SectionHeader>,
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "FCS football" }),
    ).toHaveAttribute("id", "fcs-heading");
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByText("Extra")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View all\s+from FCS football/ }),
    ).toHaveAttribute("href", "/college/football/news/fcs");
  });

  it("uses a custom link label", () => {
    render(<SectionHeader title="Teams" href="/teams" linkLabel="See more" />);
    expect(screen.getByRole("link", { name: /See more/ })).toHaveAttribute(
      "href",
      "/teams",
    );
  });

  it("omits the badge and link when not provided", () => {
    render(<SectionHeader title="Latest" />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Latest" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
