import { render, screen } from "@testing-library/react";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../breadcrumb";

describe("Breadcrumb", () => {
  function renderTrail() {
    return render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Components</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
  }

  it("is a labelled trail of links ending at the current page", () => {
    renderTrail();
    const nav = screen.getByRole("navigation", { name: "breadcrumb" });
    const links = nav.querySelectorAll("a");
    expect([...links].map((link) => link.getAttribute("href"))).toEqual([
      "/",
      "/docs",
    ]);
    const page = screen.getByText("Components");
    expect(page).toHaveAttribute("aria-current", "page");
    expect(page).toHaveAttribute("aria-disabled", "true");
  });

  it("hides separators from screen readers and names the ellipsis", () => {
    renderTrail();
    // The four crumbs are list items; the separators are not.
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByText("/")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("More")).toHaveClass("sr-only");
  });
});
