import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { sportHubBlurb } from "@/components/chrome/sport-mega-panel";
import {
  NavbarClient,
  NavbarSkeletonResponsive,
  NavMenuContent,
  navItemHasPanel,
  navItemLabel,
} from "@/components/navbar-client";
import {
  aboutColumn,
  brokenLink,
  emptyColumn,
  emptyRankingsMenu,
  footballMenu,
  linksRankingsMenu,
  navItems,
  noPollsSportMenu,
  rankingsMenu,
  shopLink,
  singleSportRankingsMenu,
  teamsLink,
} from "../helpers/nav-fixtures";

const { mockUseIsMobile, mockUsePathname } = vi.hoisted(() => ({
  mockUseIsMobile: vi.fn(),
  mockUsePathname: vi.fn(() => "/"),
}));

vi.mock("next/navigation", () => ({
  usePathname: mockUsePathname,
}));

vi.mock("@/hooks/use-is-mobile", () => ({
  useIsMobile: mockUseIsMobile,
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    prefetch: _prefetch,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/logo", () => ({
  Logo: ({ alt }: { alt?: string | null }) => <div>{alt}</div>,
}));

vi.mock("@/components/search-bar", () => ({
  SearchBar: ({ placeholder }: { placeholder?: string }) => (
    <input aria-label={placeholder ?? "search"} />
  ),
}));

vi.mock("@/components/mode-toggle", () => ({
  ModeToggle: () => <button type="button">Toggle theme</button>,
}));

const settingsData = {
  siteBrand: "Redshirt Sports",
  logo: { alt: "Logo" },
} as never;

function renderNav(items = navItems) {
  return render(<NavbarClient items={items} settingsData={settingsData} />);
}

describe("navItemLabel", () => {
  it("labels every item type", () => {
    expect(navItemLabel(footballMenu)).toBe("College Football");
    expect(navItemLabel(noPollsSportMenu)).toBe("WBB Hoops");
    expect(navItemLabel(rankingsMenu)).toBe("Rankings");
    expect(navItemLabel(aboutColumn)).toBe("About");
    expect(navItemLabel(emptyColumn)).toBe("");
    expect(navItemLabel(teamsLink)).toBe("Teams");
    expect(navItemLabel(brokenLink)).toBe("");
  });
});

describe("navItemHasPanel", () => {
  it("opens panels only for items with something to show", () => {
    expect(navItemHasPanel(footballMenu)).toBe(true);
    expect(navItemHasPanel(rankingsMenu)).toBe(true);
    expect(navItemHasPanel(emptyRankingsMenu)).toBe(false);
    expect(navItemHasPanel(aboutColumn)).toBe(true);
    expect(navItemHasPanel(emptyColumn)).toBe(false);
    expect(navItemHasPanel(teamsLink)).toBe(false);
  });
});

describe("NavMenuContent", () => {
  it("renders nothing for a plain link", () => {
    const { container } = render(<NavMenuContent item={teamsLink} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("sportHubBlurb", () => {
  it("summarizes the menu's divisions", () => {
    expect(sportHubBlurb([])).toBe("Every story, all season long.");
    expect(sportHubBlurb(["Mid-Major"])).toBe("Every story from Mid-Major.");
    expect(sportHubBlurb(["FCS", "FBS", "D2"])).toBe(
      "Every story from FCS, FBS and D2.",
    );
  });
});

describe("NavbarClient", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/");
  });

  it("renders the responsive skeleton while mobile state is unknown", () => {
    mockUseIsMobile.mockReturnValue(null);
    const { container } = renderNav();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      2,
    );
  });

  it("renders desktop triggers and links in editor order", () => {
    mockUseIsMobile.mockReturnValue(false);
    renderNav();

    const nav = screen.getByRole("navigation", { name: "Site" });
    const labels = [...nav.querySelectorAll("button, a")].map((el) =>
      el.textContent?.trim(),
    );
    expect(labels).toEqual([
      "College Football",
      "WBB Hoops",
      "Rankings",
      "About",
      "Teams",
      "Shop",
    ]);
    expect(within(nav).getByRole("link", { name: "Teams" })).toHaveAttribute(
      "href",
      "/college/teams",
    );
    expect(within(nav).getByRole("link", { name: "Shop" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(
      within(nav).getByRole("link", { name: "Teams" }),
    ).not.toHaveAttribute("target");
    expect(screen.getByLabelText("Search Redshirt Sports")).toBeInTheDocument();
  });

  async function openMenu(name: string) {
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name }));
    return screen.getByRole("button", { name }).closest("li")!;
  }

  it("opens a sport menu with the hub card, polls, and division pills", async () => {
    mockUseIsMobile.mockReturnValue(false);
    renderNav();

    const menu = await openMenu("College Football");

    expect(
      within(menu).getByRole("link", { name: /News hub\s*College Football/ }),
    ).toHaveAttribute("href", "/college/football/news");
    expect(within(menu).getByText("Every story from FBS.")).toBeInTheDocument();
    expect(
      within(menu).getByRole("link", { name: /FBS Top 25/ }),
    ).toHaveAttribute("href", "/college/football/rankings/fbs");
    expect(
      within(menu).getByRole("link", { name: "All rankings" }),
    ).toHaveAttribute("href", "/college/football/rankings");
    expect(within(menu).getByRole("link", { name: "FBS" })).toHaveAttribute(
      "href",
      "/college/football/news/fbs",
    );
    expect(within(menu).queryByText("Broken")).toBeNull();
  });

  it("shows only the hub card for a sport without polls or divisions", async () => {
    mockUseIsMobile.mockReturnValue(false);
    renderNav();

    const menu = await openMenu("WBB Hoops");

    expect(
      within(menu).getByText("Every story, all season long."),
    ).toBeInTheDocument();
    expect(within(menu).queryByText("Top 25")).toBeNull();
    expect(within(menu).queryByText("News by division")).toBeNull();
  });

  it("opens the rankings menu grouped by sport", async () => {
    mockUseIsMobile.mockReturnValue(false);
    renderNav();

    const menu = await openMenu("Rankings");

    expect(
      within(menu).getByRole("link", { name: /Mid-Major Top 25/ }),
    ).toHaveAttribute("href", "/college/mens-basketball/rankings/mid-major");
    expect(
      within(menu).getByRole("link", { name: "All Men's Basketball rankings" }),
    ).toHaveAttribute("href", "/college/mens-basketball/rankings");
    expect(within(menu).queryByText("Women's Basketball")).toBeNull();
  });

  it("uses a narrow rankings menu for a single sport", async () => {
    mockUseIsMobile.mockReturnValue(false);
    renderNav([singleSportRankingsMenu]);

    const menu = await openMenu("Polls");

    expect(
      within(menu).getByRole("link", { name: /FCS Top 25/ }),
    ).toHaveAttribute("href", "/college/football/rankings/fcs");
  });

  it("adds editor links to each sport's rankings section", async () => {
    mockUseIsMobile.mockReturnValue(false);
    renderNav([linksRankingsMenu]);

    const menu = await openMenu("Rankings");

    const ratings = within(menu).getByRole("link", {
      name: /FCS Ratings & SOS/,
    });
    expect(ratings).toHaveAttribute("href", "/college/football/ratings/fcs");
    expect(ratings).toHaveTextContent("Computer ratings, FCS games only");
    expect(ratings).not.toHaveAttribute("target");
    expect(
      within(menu).getByRole("link", { name: "How the ratings work" }),
    ).toHaveAttribute("target", "_blank");

    // Links follow the polls and come before "All … rankings".
    const names = within(menu)
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(
      names.findIndex((name) => name?.includes("FCS Top 25")),
    ).toBeLessThan(
      names.findIndex((name) => name?.includes("FCS Ratings & SOS")),
    );
    expect(
      names.findIndex((name) => name?.includes("How the ratings work")),
    ).toBeLessThan(
      names.findIndex((name) =>
        name?.includes("All College Football rankings"),
      ),
    );

    // A sport with only links still gets a section, without "All … rankings".
    expect(within(menu).getByText("Women's Basketball")).toBeInTheDocument();
    expect(
      within(menu).getByRole("link", { name: "WBB Bracketology" }),
    ).toHaveAttribute("href", "/college/womens-basketball/bracketology");
    expect(
      within(menu).queryByRole("link", {
        name: "All Women's Basketball rankings",
      }),
    ).toBeNull();

    // No URL, or a sport that isn't in the menu: dropped.
    expect(within(menu).queryByText("No URL")).toBeNull();
    expect(within(menu).queryByText("Not In Menu")).toBeNull();
  });

  it("opens a link column with descriptions and new-tab links", async () => {
    mockUseIsMobile.mockReturnValue(false);
    renderNav();

    const menu = await openMenu("About");

    expect(within(menu).getByText("Who we are")).toBeInTheDocument();
    expect(
      within(menu).getByRole("link", { name: /Follow on X/ }),
    ).toHaveAttribute("target", "_blank");
    expect(within(menu).queryByText("Broken")).toBeNull();
  });

  it("uses a single-column dropdown for short link columns", async () => {
    mockUseIsMobile.mockReturnValue(false);
    renderNav([
      {
        ...aboutColumn,
        links: [...aboutColumn.links, ...aboutColumn.links.slice(0, 2)].map(
          (link, index) => ({ ...link, _key: `k${index}` }),
        ),
      },
    ] as never);

    const wide = await openMenu("About");
    expect(within(wide).getAllByRole("link")).toHaveLength(4);
  });

  it("lists every link in a short column", async () => {
    mockUseIsMobile.mockReturnValue(false);
    renderNav([{ ...aboutColumn, _key: "col-short", title: "Short" }] as never);

    const short = await openMenu("Short");
    expect(within(short).getAllByRole("link")).toHaveLength(2);
  });

  it("renders every item in the mobile sheet", async () => {
    mockUseIsMobile.mockReturnValue(true);
    const user = userEvent.setup();
    renderNav();

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const sheet = screen.getByRole("dialog");

    expect(
      within(sheet).getByRole("link", { name: "All College Football news" }),
    ).toHaveAttribute("href", "/college/football/news");
    expect(
      within(sheet).getByRole("link", { name: "FBS news" }),
    ).toHaveAttribute("href", "/college/football/news/fbs");
    expect(
      within(sheet).getByRole("link", { name: "College Football FBS Top 25" }),
    ).toHaveAttribute("href", "/college/football/rankings/fbs");
    expect(
      within(sheet).getByRole("link", { name: "Follow on X" }),
    ).toHaveAttribute("target", "_blank");
    expect(
      within(sheet).getByRole("link", { name: "About Us" }),
    ).not.toHaveAttribute("target");
    expect(within(sheet).getByRole("link", { name: "Shop" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(within(sheet).getByRole("link", { name: "Teams" })).toHaveAttribute(
      "href",
      "/college/teams",
    );
    expect(within(sheet).queryByText("Empty Rankings")).toBeNull();
    expect(within(sheet).queryByText("Nothing")).toBeNull();

    await user.click(within(sheet).getByRole("link", { name: "Teams" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("omits the sport name in a single-sport mobile rankings menu", async () => {
    mockUseIsMobile.mockReturnValue(true);
    const user = userEvent.setup();
    renderNav([singleSportRankingsMenu, shopLink]);

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(screen.getByRole("link", { name: "FCS Top 25" })).toHaveAttribute(
      "href",
      "/college/football/rankings/fcs",
    );
  });

  it("lists rankings menu links in the mobile sheet", async () => {
    mockUseIsMobile.mockReturnValue(true);
    const user = userEvent.setup();
    renderNav([linksRankingsMenu]);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const sheet = screen.getByRole("dialog");

    expect(
      within(sheet).getByRole("link", { name: "FCS Ratings & SOS" }),
    ).toHaveAttribute("href", "/college/football/ratings/fcs");
    expect(
      within(sheet).getByRole("link", { name: "How the ratings work" }),
    ).toHaveAttribute("target", "_blank");
    expect(
      within(sheet).getByRole("link", { name: "FCS Ratings & SOS" }),
    ).not.toHaveAttribute("target");
    expect(
      within(sheet).getByRole("link", { name: "WBB Bracketology" }),
    ).toBeInTheDocument();
    expect(within(sheet).queryByText("No URL")).toBeNull();
  });

  it("shows the mobile search control when the menu is closed", () => {
    mockUseIsMobile.mockReturnValue(true);
    renderNav();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });

  it("uses site title when site brand is missing", () => {
    mockUseIsMobile.mockReturnValue(false);
    render(
      <NavbarClient
        items={navItems}
        settingsData={{ siteTitle: "Fallback Title" } as never}
      />,
    );
    expect(screen.getByText("Fallback Title")).toBeInTheDocument();
  });

  it("falls back to the default brand label when settings are sparse", () => {
    mockUseIsMobile.mockReturnValue(false);
    render(<NavbarClient items={navItems} settingsData={{} as never} />);
    expect(screen.getByText("Redshirt Sports")).toBeInTheDocument();
  });

  it("closes the mobile sheet when the pathname changes", async () => {
    mockUseIsMobile.mockReturnValue(true);
    const user = userEvent.setup();
    const { rerender } = renderNav();

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open");

    mockUsePathname.mockReturnValue("/college/football/news");
    rerender(
      <NavbarClient items={[...navItems]} settingsData={settingsData} />,
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

describe("NavbarSkeletonResponsive", () => {
  it("renders mobile and desktop skeletons", () => {
    const { container } = render(<NavbarSkeletonResponsive />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      2,
    );
  });
});
