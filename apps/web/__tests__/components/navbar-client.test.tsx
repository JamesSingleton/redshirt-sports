import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  DesktopNavbar,
  NavbarClient,
  NavbarSkeletonResponsive,
} from "@/components/navbar-client";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("@/components/logo", () => ({
  Logo: ({ alt }: { alt?: string | null }) => (
    <div>{alt ?? "Redshirt Sports"}</div>
  ),
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
  it("renders sport nav, rankings, news, and sign-in actions", () => {
    render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankings={latestRankings}
      />,
    );

    expect(screen.getByText("Football")).toBeInTheDocument();
    expect(screen.getAllByText("Rankings").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });

  it("opens mobile sheet with division and rankings links", async () => {
    const user = userEvent.setup();
    render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankings={latestRankings}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(screen.getByRole("link", { name: "FBS" })).toHaveAttribute(
      "href",
      "/college/football/news/fbs",
    );
    expect(
      screen.getByRole("link", { name: /FBS Football Rankings/i }),
    ).toHaveAttribute("href", "/college/football/rankings/fbs/2025/1");
    expect(screen.getByRole("link", { name: "News" })).toHaveAttribute(
      "href",
      "/college/news",
    );
    expect(
      screen.getByRole("link", { name: "Bracket Challenge" }),
    ).toBeInTheDocument();
  });

  it("handles missing settings and ranking week fallbacks in the sheet", async () => {
    const user = userEvent.setup();

    render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={null as never}
        latestRankings={
          [
            {
              sport: "football",
              divisions: [{ division: "fbs", year: 2025 }],
            },
          ] as never
        }
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));

    expect(
      screen.getByRole("link", { name: /FBS Football Rankings/i }),
    ).toHaveAttribute("href", "/college/football/rankings/fbs/2025/0");
  });
});

describe("DesktopNavbar", () => {
  it("renders football rankings links with display names", () => {
    render(
      <DesktopNavbar navbarData={navbarData} latestRankings={latestRankings} />,
    );

    expect(
      screen.getByRole("link", { name: /FBS Football Rankings/i }),
    ).toHaveAttribute("href", "/college/football/rankings/fbs/2025/1");
    expect(
      screen.getByRole("link", { name: /FCS Football Rankings/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Coming Soon...")).toBeInTheDocument();
  });

  it("falls back when ranking week and division labels are missing", () => {
    render(
      <DesktopNavbar
        navbarData={
          [
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
                      name: "Big Ten Conference",
                      shortName: null,
                      slug: "big-ten",
                    },
                  ],
                },
              ],
            },
          ] as never
        }
        latestRankings={
          [
            {
              sport: "football",
              divisions: [{ division: undefined, week: undefined, year: 2025 }],
            },
          ] as never
        }
      />,
    );

    expect(
      screen.getByRole("link", { name: "Big Ten Conference" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Football Rankings/i }),
    ).toHaveAttribute("href", "/college/football/rankings/undefined/2025/0");
  });

  it("uses an empty divisions list when football rankings are absent", () => {
    render(
      <DesktopNavbar
        navbarData={navbarData}
        latestRankings={[{ sport: "basketball", divisions: [] }] as never}
      />,
    );

    expect(screen.getByText("Rankings")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Football Rankings/i }),
    ).not.toBeInTheDocument();
  });
});

describe("NavbarSkeletonResponsive", () => {
  it("renders pulse placeholders", () => {
    const { container } = render(<NavbarSkeletonResponsive />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });
});
