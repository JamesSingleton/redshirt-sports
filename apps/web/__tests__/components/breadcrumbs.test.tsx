import { render, screen } from "@testing-library/react";

import BreadCrumbs from "@/components/breadcrumbs";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    "aria-current": ariaCurrent,
  }: {
    children: React.ReactNode;
    href: string;
    "aria-current"?: "page";
  }) => (
    <a href={href} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
}));

describe("BreadCrumbs", () => {
  it("renders home and breadcrumb trail links", () => {
    render(
      <BreadCrumbs
        breadCrumbPages={[
          { title: "College Football", href: "/college/football/news" },
          { title: "FBS", href: "/college/football/news/fbs" },
        ]}
      />,
    );

    expect(
      screen.getByRole("navigation", { name: "breadcrumb" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("link", { name: "College Football" }),
    ).toHaveAttribute("href", "/college/football/news");
    expect(screen.getByRole("link", { name: "FBS" })).toHaveAttribute(
      "href",
      "/college/football/news/fbs",
    );
    expect(screen.getByRole("link", { name: "FBS" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("filters out null breadcrumb entries", () => {
    render(
      <BreadCrumbs
        breadCrumbPages={[
          { title: "College Football", href: "/college/football/news" },
          null as unknown as { title: string; href: string },
        ]}
      />,
    );

    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(
      screen.queryByRole("link", { name: "null" }),
    ).not.toBeInTheDocument();
  });
});
