import { fireEvent, render, screen } from "@testing-library/react";

import { PrimaryNav } from "@/components/site-header/primary-nav";
import type { NavItem } from "@/lib/navigation";

const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn(() => "/college/football/news/fbs"),
}));

vi.mock("next/navigation", () => ({
  usePathname: mockUsePathname,
}));

const items: NavItem[] = [
  {
    type: "link",
    key: "teams",
    name: "Teams",
    href: "/college/teams",
    description: null,
    openInNewTab: false,
  },
  {
    type: "menu",
    key: "football",
    title: "Football",
    links: [
      {
        key: "fbs",
        name: "FBS",
        href: "/college/football/news/fbs",
        description: "Bowl Subdivision news",
        openInNewTab: false,
      },
      {
        key: "shop",
        name: "Shop",
        href: "https://shop.example.com",
        description: null,
        openInNewTab: true,
      },
    ],
  },
  {
    type: "menu",
    key: "hoops",
    title: "Men's Basketball",
    links: [
      {
        key: "mid",
        name: "Mid-Major",
        href: "/college/mens-basketball/news/mid-major",
        description: null,
        openInNewTab: false,
      },
    ],
  },
];

describe("PrimaryNav", () => {
  it("renders nothing without items", () => {
    const { container } = render(<PrimaryNav items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders top-level links and marks the active menu", () => {
    render(<PrimaryNav items={items} />);

    expect(screen.getByRole("link", { name: "Teams" })).toHaveAttribute(
      "href",
      "/college/teams",
    );
    expect(screen.getByRole("button", { name: /Football/ })).toHaveAttribute(
      "data-active",
    );
    expect(
      screen.getByRole("button", { name: /Men's Basketball/ }),
    ).not.toHaveAttribute("data-active");
  });

  it("opens a dropdown with descriptions and new-tab links", () => {
    render(<PrimaryNav items={items} />);

    fireEvent.click(screen.getByRole("button", { name: /Football/ }));

    expect(screen.getByText("Bowl Subdivision news")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shop" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByRole("link", { name: /FBS/ })).toHaveAttribute(
      "data-active",
    );
  });
});
