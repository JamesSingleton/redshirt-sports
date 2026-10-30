import { render, screen } from "@testing-library/react";

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

import { SiteBreadcrumb } from "@/components/chrome/site-breadcrumb";

describe("SiteBreadcrumb", () => {
  it("renders links for intermediate crumbs and plain text for the last", () => {
    render(
      <SiteBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Current" },
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
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Current" }),
    ).not.toBeInTheDocument();
  });

  it("renders a label without href when it is not the last item", () => {
    render(
      <SiteBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "No link" },
          { label: "Current" },
        ]}
      />,
    );

    expect(screen.getByText("No link")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "No link" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Current")).toHaveClass("text-foreground");
  });
});
