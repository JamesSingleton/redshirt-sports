import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { NavbarClient, NavbarSkeletonResponsive } from "@/components/navbar-client";

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
    ],
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
    expect(
      screen.getByLabelText("Search Redshirt Sports"),
    ).toBeInTheDocument();
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

    expect(screen.getByRole("link", { name: /FBS news/i })).toHaveAttribute(
      "href",
      "/college/football/news/fbs",
    );
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
