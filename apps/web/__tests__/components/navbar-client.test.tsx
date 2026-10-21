import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  NavbarClient,
  NavbarSkeletonResponsive,
} from "@/components/navbar-client";

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

vi.mock("@/components/chrome/sport-mega-panel", () => ({
  SportMegaPanel: ({ onNavigate }: { onNavigate: () => void }) => (
    <button type="button" data-testid="sport-mega-panel" onClick={onNavigate}>
      Mega
    </button>
  ),
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
        ],
      },
      {
        _id: "group-2",
        name: "Invalid",
        slug: null,
        conferences: [],
      },
    ],
  },
  {
    _id: "sport-2",
    name: "Lacrosse",
    slug: "lacrosse",
    groupings: [],
  },
] as never;

const settingsData = {
  siteTitle: "Redshirt Sports",
  siteBrand: "Redshirt Sports",
  logo: { alt: "Logo" },
} as never;

const latestRankings = [
  {
    sport: "football",
    divisions: [{ division: "fcs", week: 7, year: 2026 }],
  },
] as never;

describe("NavbarClient", () => {
  it("renders the shell before deferred rankings resolve", () => {
    mockUseIsMobile.mockReturnValue(false);

    const rankingsPromise = new Promise<typeof latestRankings>(() => {});

    render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankingsPromise={rankingsPromise}
      />,
    );

    expect(screen.getByText("Redshirt Sports")).toBeInTheDocument();
    expect(screen.queryByText("Rankings")).not.toBeInTheDocument();
  });

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

  it("renders the desktop navbar with sport mega trigger and utility links", () => {
    mockUseIsMobile.mockReturnValue(false);
    render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankings={latestRankings}
      />,
    );

    expect(
      screen.getByRole("button", { name: /College Football/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Rankings" })).toHaveAttribute(
      "href",
      "/college/football/rankings",
    );
    expect(screen.getByRole("link", { name: "Teams" })).toHaveAttribute(
      "href",
      "/college/teams",
    );
    expect(screen.getByLabelText("Search Redshirt Sports")).toBeInTheDocument();
  });

  it("opens the desktop sport mega panel with division news links", async () => {
    mockUseIsMobile.mockReturnValue(false);
    const user = userEvent.setup();
    render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankings={latestRankings}
      />,
    );

    await user.click(screen.getByRole("button", { name: /College Football/i }));

    expect(screen.getByTestId("sport-mega-panel")).toBeInTheDocument();
  });

  it("renders the mobile menu trigger and sheet navigation", async () => {
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

    expect(
      screen.getByRole("link", { name: /All College Football news/i }),
    ).toHaveAttribute("href", "/college/football/news");
    const rankingsLinks = screen.getAllByRole("link", { name: "Rankings" });
    expect(
      rankingsLinks.some(
        (link) => link.getAttribute("href") === "/college/football/rankings",
      ),
    ).toBe(true);

    expect(screen.getByRole("link", { name: /FBS news/i })).toHaveAttribute(
      "href",
      "/college/football/news/fbs",
    );

    await user.click(screen.getByRole("button", { name: "Close menu" }));
  });

  it("cleans up the global Escape listener on unmount", () => {
    mockUseIsMobile.mockReturnValue(false);
    const { unmount } = render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankings={latestRankings}
      />,
    );

    unmount();
    fireEvent.keyDown(window, { key: "Escape" });
  });

  it("opens the desktop mega panel and closes it with Escape", async () => {
    mockUseIsMobile.mockReturnValue(false);
    const user = userEvent.setup();
    render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankings={latestRankings}
      />,
    );

    const trigger = screen.getByRole("button", { name: /College Football/i });
    await user.click(trigger);
    expect(screen.getByTestId("sport-mega-panel")).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.queryByTestId("sport-mega-panel")).not.toBeInTheDocument();

    await user.click(trigger);
    fireEvent.keyDown(screen.getByRole("navigation", { name: "Sports" }), {
      key: "Escape",
    });
    expect(screen.queryByTestId("sport-mega-panel")).not.toBeInTheDocument();

    await user.click(trigger);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("sport-mega-panel")).not.toBeInTheDocument();

    await user.click(trigger);
    const region = screen.getByRole("region", {
      name: /College Football menu/i,
    });
    fireEvent.mouseLeave(region.parentElement!);
    expect(screen.queryByTestId("sport-mega-panel")).not.toBeInTheDocument();

    await user.click(trigger);
    await user.click(screen.getByTestId("sport-mega-panel"));
    expect(screen.queryByTestId("sport-mega-panel")).not.toBeInTheDocument();
  });

  it("renders the mobile search control when the menu is closed", () => {
    mockUseIsMobile.mockReturnValue(true);
    render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankings={[]}
      />,
    );

    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Rankings" }),
    ).not.toBeInTheDocument();
  });

  it("uses site title when site brand is missing", () => {
    mockUseIsMobile.mockReturnValue(false);
    render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={
          { siteTitle: "Fallback Title", logo: { alt: "Logo" } } as never
        }
        latestRankings={latestRankings}
      />,
    );

    expect(screen.getByText("Fallback Title")).toBeInTheDocument();
  });

  it("falls back to the default brand label when settings are sparse", () => {
    mockUseIsMobile.mockReturnValue(false);
    render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={{ logo: { alt: "Logo" } } as never}
        latestRankings={latestRankings}
      />,
    );

    expect(screen.getByText("Redshirt Sports")).toBeInTheDocument();
  });

  it("hides global rankings links when there is no latest poll data", () => {
    mockUseIsMobile.mockReturnValue(false);
    render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankings={[]}
      />,
    );

    expect(
      screen.queryByRole("link", { name: "Rankings" }),
    ).not.toBeInTheDocument();
  });

  it("closes the mobile sheet when the pathname changes", async () => {
    mockUseIsMobile.mockReturnValue(true);
    const user = userEvent.setup();
    const { rerender } = render(
      <NavbarClient
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankings={latestRankings}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open");

    mockUsePathname.mockReturnValue("/college/football/news");
    rerender(
      <NavbarClient
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankings={[...latestRankings]}
      />,
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
