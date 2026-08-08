import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  DesktopNavbar,
  NavbarClient,
  NavbarSkeletonResponsive,
} from "@/components/navbar-client";

const { mockUseIsMobile } = vi.hoisted(() => ({
  mockUseIsMobile: vi.fn(),
}));

vi.mock("@/hooks/use-is-mobile", () => ({
  useIsMobile: mockUseIsMobile,
}));

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

vi.mock("@redshirt-sports/ui/components/navigation-menu", () => ({
  NavigationMenu: ({ children }: { children: React.ReactNode }) => (
    <nav>{children}</nav>
  ),
  NavigationMenuList: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  NavigationMenuItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  NavigationMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
  NavigationMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  NavigationMenuLink: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
  navigationMenuTriggerStyle: () => "nav-link",
}));

const navbarData = [
  {
    _id: "sport-1",
    name: "Football",
    slug: "football",
    groupings: [
      {
        _id: "group-1",
        name: "FBS",
        slug: "fbs",
        conferences: [
          {
            _id: "conf-1",
            name: "Southeastern Conference",
            shortName: "SEC",
            slug: "sec",
          },
          {
            _id: "conf-2",
            name: "Atlantic Coast Conference",
            shortName: null,
            slug: "acc",
          },
        ],
      },
    ],
  },
] as never;

const settingsData = {
  siteTitle: "Redshirt Sports",
  logo: { alt: "Logo" },
} as never;

const latestRankings = [
  {
    sport: "football",
    divisions: [
      { division: "fbs", week: 1, year: 2025 },
      { division: "fcs", week: 1, year: 2025 },
    ],
  },
] as never;

describe("NavbarClient", () => {
  it("renders the responsive skeleton while mobile state is unknown", () => {
    mockUseIsMobile.mockReturnValue(null);
    const { container } = render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankings={latestRankings}
      />,
    );

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("renders the desktop navbar", () => {
    mockUseIsMobile.mockReturnValue(false);
    render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankings={latestRankings}
      />,
    );

    expect(screen.getByText("Football")).toBeInTheDocument();
    expect(screen.getByText("Rankings")).toBeInTheDocument();
    expect(screen.getByText("News")).toBeInTheDocument();
    expect(screen.getByLabelText("Search articles...")).toBeInTheDocument();
  });

  it("renders the mobile navbar menu trigger", () => {
    mockUseIsMobile.mockReturnValue(true);
    render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankings={latestRankings}
      />,
    );

    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });

  it("opens mobile conference and rankings navigation", async () => {
    mockUseIsMobile.mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankings={latestRankings}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Football" }));
    await user.click(screen.getByRole("button", { name: /FBS \(2\)/i }));

    const conferenceLink = screen.getByRole("link", { name: "SEC" });
    expect(conferenceLink).toHaveAttribute(
      "href",
      "/college/football/news/fbs/sec",
    );
    await user.click(conferenceLink);
  });

  it("opens mobile rankings navigation", async () => {
    mockUseIsMobile.mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankings={latestRankings}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Rankings" }));
    await user.click(screen.getByRole("button", { name: /College Football/i }));

    const rankingsLink = screen.getByRole("link", {
      name: /FBS Football Rankings/i,
    });
    expect(rankingsLink).toHaveAttribute(
      "href",
      "/college/football/rankings/fbs/2025/1",
    );
    await user.click(rankingsLink);
    expect(screen.getByRole("link", { name: "News" })).toHaveAttribute(
      "href",
      "/college/news",
    );
  });

  it("navigates every mobile menu path including basketball and conference fallbacks", async () => {
    mockUseIsMobile.mockReturnValue(true);
    const user = userEvent.setup();
    const rankingsWithUnknownDivision = [
      {
        sport: "football",
        divisions: [{ division: "custom-division", week: 2, year: 2025 }],
      },
    ] as never;

    render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankings={rankingsWithUnknownDivision}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Football" }));
    await user.click(screen.getByRole("button", { name: /FBS \(2\)/i }));

    const accLink = screen.getByRole("link", {
      name: "Atlantic Coast Conference",
    });
    expect(accLink).toHaveAttribute(
      "href",
      "/college/football/news/fbs/acc",
    );
    await user.click(accLink);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Rankings" }));
    await user.click(screen.getByRole("button", { name: /College Football/i }));
    await user.click(
      screen.getByRole("link", { name: /custom-division Football Rankings/i }),
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Rankings" }));
    await user.click(screen.getByRole("button", { name: /Men's Basketball/i }));
    expect(screen.getByText("Coming Soon...")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "News" }));
  });
});

describe("DesktopNavbar", () => {
  it("renders football rankings links with display names", () => {
    render(
      <DesktopNavbar
        navbarData={navbarData}
        latestRankings={latestRankings}
      />,
    );

    expect(
      screen.getByRole("link", { name: /FBS Football Rankings/i }),
    ).toHaveAttribute("href", "/college/football/rankings/fbs/2025/1");
    expect(
      screen.getByRole("link", { name: /FCS Football Rankings/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Coming Soon...")).toBeInTheDocument();
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
