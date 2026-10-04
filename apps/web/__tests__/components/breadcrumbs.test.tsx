import { render, screen } from "@testing-library/react";

import BreadCrumbs from "@/components/breadcrumbs";

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

describe("BreadCrumbs", () => {
  it("renders home, linked ancestors and the current page", () => {
    render(
      <BreadCrumbs
        breadCrumbPages={[
          { title: "College Football", href: "/college/football/news" },
          { title: "FBS", href: "/college/football/news/fbs" },
        ]}
      />,
    );

    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("link", { name: "College Football" }),
    ).toHaveAttribute("href", "/college/football/news");
    expect(screen.queryByRole("link", { name: "FBS" })).not.toBeInTheDocument();
    expect(screen.getByText("FBS")).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
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

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByText("College Football")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
