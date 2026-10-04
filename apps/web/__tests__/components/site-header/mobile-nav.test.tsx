import { fireEvent, render, screen, within } from "@testing-library/react";

import { MobileNav } from "@/components/site-header/mobile-nav";
import type { Navigation } from "@/lib/navigation";

vi.mock("next/navigation", () => ({
  usePathname: () => "/college/teams",
}));

const navigation: Navigation = {
  items: [
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
          description: null,
          openInNewTab: false,
        },
      ],
    },
  ],
  secondaryLinks: [
    {
      key: "about",
      name: "About",
      href: "/about",
      description: null,
      openInNewTab: false,
    },
  ],
  cta: {
    key: "cta",
    name: "Vote",
    href: "/vote",
    description: null,
    openInNewTab: false,
  },
};

function openDrawer() {
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  return screen.getByRole("dialog");
}

describe("MobileNav", () => {
  it("lists every section expanded under bold headings", () => {
    render(
      <MobileNav
        navigation={navigation}
        brandName="Redshirt Sports"
        logo={<img src="/logo.svg" alt="" />}
      />,
    );
    const drawer = openDrawer();

    expect(
      within(drawer).getByRole("heading", { name: "Football" }),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByRole("heading", { name: "More" }),
    ).toBeInTheDocument();
    expect(within(drawer).getByRole("link", { name: "FBS" })).toBeVisible();
    expect(within(drawer).getByRole("link", { name: "Teams" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(drawer).getByRole("link", { name: "Vote" })).toHaveAttribute(
      "href",
      "/vote",
    );
    expect(within(drawer).getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(
      within(drawer).getByRole("link", { name: "FBS" }),
    ).not.toHaveAttribute("aria-current");
    expect(
      within(drawer).queryByRole("link", { name: "Log in" }),
    ).not.toBeInTheDocument();
  });

  it("titles the drawer with the brand and includes search", () => {
    render(
      <MobileNav
        navigation={navigation}
        brandName="Redshirt Sports"
        logo={<img src="/logo.svg" alt="" />}
      />,
    );
    const drawer = openDrawer();

    expect(drawer).toHaveAccessibleName("Redshirt Sports");
    expect(within(drawer).getByRole("search")).toBeInTheDocument();
    expect(
      within(drawer).getByRole("searchbox", { name: "Search articles" }),
    ).toBeInTheDocument();
    expect(
      within(drawer).getByRole("navigation", { name: "Mobile" }),
    ).toBeInTheDocument();
  });

  it("omits empty groups and the CTA when not configured", () => {
    render(
      <MobileNav
        navigation={{ items: [], secondaryLinks: [], cta: null }}
        brandName="Redshirt Sports"
        logo={<img src="/logo.svg" alt="" />}
      />,
    );
    const drawer = openDrawer();

    expect(
      within(drawer).queryByRole("heading", { name: "More" }),
    ).not.toBeInTheDocument();
    expect(within(drawer).queryByRole("list")).not.toBeInTheDocument();
    expect(
      within(drawer).queryByRole("link", { name: "Vote" }),
    ).not.toBeInTheDocument();
  });
});
