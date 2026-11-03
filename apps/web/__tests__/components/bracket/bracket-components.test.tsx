import { buildBracketView } from "@redshirt-sports/db/playoff-bracket";
import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  bracketEdition,
  bracketSlots,
  bracketStats,
  bracketView,
  FCS_SPEC,
} from "@/__tests__/helpers/bracket-fixtures";

const mockGetCachedPublishedBracket = vi.hoisted(() => vi.fn());

vi.mock("@/lib/bracket-data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/bracket-data")>()),
  getCachedPublishedBracket: mockGetCachedPublishedBracket,
}));
vi.mock("@/components/bracket/bracket-edition-picker", () => ({
  BracketEditionPicker: ({
    seasons,
    editions,
    currentHref,
  }: {
    seasons: { year: number; href: string }[];
    editions: { href: string; label: string }[];
    currentHref: string;
  }) => (
    <ul aria-label="Picker" data-current={currentHref}>
      {seasons.map((season) => (
        <li key={season.year} data-href={season.href}>
          {season.year}
        </li>
      ))}
      {editions.map((option) => (
        <li key={option.href} data-href={option.href}>
          {option.label}
        </li>
      ))}
    </ul>
  ),
}));
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { BracketEmbed } from "@/components/bracket/bracket-embed";
import {
  BracketPageView,
  bracketTitle,
} from "@/components/bracket/bracket-page-view";
import { BracketSkeleton } from "@/components/bracket/bracket-skeleton";

const official = bracketEdition({
  id: "official",
  kind: "official",
  weekId: null,
  weekNumber: null,
});

describe("BracketPageView", () => {
  it("renders the projection header, switcher, bracket and FCS note", () => {
    const edition = bracketEdition({
      publicNote: "If the playoffs started today.",
      articleUrl: "https://www.redshirtsports.com/week-7",
    });
    render(
      <BracketPageView
        model={{
          stats: bracketStats(),
          seasons: [2026],
          edition,
          view: bracketView(),
          official,
          projections: [edition, bracketEdition({ id: "w6", weekNumber: 6 })],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "2026 FCS Playoff Bracket",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Projection after Week 7")).toBeInTheDocument();
    expect(
      screen.getByText("If the playoffs started today."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Read how we built this bracket" }),
    ).toHaveAttribute("href", "https://www.redshirtsports.com/week-7");

    const picker = screen.getByRole("list", { name: "Picker" });
    expect(picker).toHaveAttribute(
      "data-current",
      "/college/football/playoffs/fcs/2026/projections/week-7",
    );
    expect(within(picker).getByText("2026")).toHaveAttribute(
      "data-href",
      "/college/football/playoffs/fcs/2026",
    );
    expect(within(picker).getByText("Official bracket")).toHaveAttribute(
      "data-href",
      "/college/football/playoffs/fcs/2026",
    );
    expect(within(picker).getByText("Week 6 projection")).toHaveAttribute(
      "data-href",
      "/college/football/playoffs/fcs/2026/projections/week-6",
    );

    // Cards open the matchup panel, so names are text, not team links.
    expect(
      screen.getByRole("button", {
        name: "First round: School 16 vs School 24",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "School 2" })).toBeNull();
    expect(
      screen.getByText(/A projection, not the NCAA field/),
    ).toBeInTheDocument();
  });

  it("hides the note and link for a lone official bracket", () => {
    render(
      <BracketPageView
        model={{
          stats: bracketStats(),
          seasons: [2026],
          edition: official,
          view: bracketView(),
          official,
          projections: [],
        }}
      />,
    );
    // The page label and the picker option.
    expect(screen.getAllByText("Official bracket")).toHaveLength(2);
    expect(
      within(screen.getByRole("list", { name: "Picker" })).getByText(
        "Official bracket",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/A projection, not the NCAA field/)).toBeNull();
  });

  it("falls back to the full name, and offers no official bracket before one exists", () => {
    const slots = bracketSlots();
    slots[1]!.team.shortName = null;
    slots[2]!.team.name = null;
    const edition = bracketEdition({ divisionSlug: null });
    render(
      <BracketPageView
        model={{
          stats: bracketStats(),
          seasons: [2026],
          edition,
          view: buildBracketView(FCS_SPEC, slots, []),
          official: null,
          projections: [edition, bracketEdition({ id: "w6", weekNumber: 6 })],
        }}
      />,
    );
    expect(screen.getByText("School 2 University")).toBeInTheDocument();
    expect(screen.getByText("School 3")).toBeInTheDocument();
    expect(screen.queryByText("Official bracket")).toBeNull();
  });

  it("titles a bracket without a division by its sport", () => {
    expect(
      bracketTitle(
        bracketEdition({ divisionSlug: null, sportSlug: "mens-basketball" }),
      ),
    ).toMatch(/^2026 .*Playoff Bracket$/);
  });
});

describe("BracketEmbed", () => {
  it("renders a published bracket with its caption and a link", async () => {
    mockGetCachedPublishedBracket.mockResolvedValueOnce({
      edition: bracketEdition(),
      view: bracketView(),
    });
    render(
      await BracketEmbed({ editionId: "edition-1", caption: "Our field" }),
    );
    expect(screen.getByText("Our field")).toBeInTheDocument();
    // The embed is not clickable, so names link to team pages.
    expect(screen.getByRole("link", { name: "School 2" })).toHaveAttribute(
      "href",
      "/college/teams/school-2",
    );
    expect(screen.getByText("School 1")).not.toHaveAttribute("href");
    expect(screen.queryByRole("button", { name: /First round/ })).toBeNull();
    expect(
      screen.getByRole("link", { name: "View full bracket" }),
    ).toHaveAttribute(
      "href",
      "/college/football/playoffs/fcs/2026/projections/week-7",
    );
  });

  it("falls back to the edition label", async () => {
    mockGetCachedPublishedBracket.mockResolvedValueOnce({
      edition: bracketEdition(),
      view: bracketView(),
    });
    render(await BracketEmbed({ editionId: "edition-1" }));
    expect(screen.getByText("Projection after Week 7")).toBeInTheDocument();
  });

  it("renders nothing for an unpublished edition", async () => {
    mockGetCachedPublishedBracket.mockResolvedValueOnce(null);
    expect(await BracketEmbed({ editionId: "draft" })).toBeNull();
  });
});

describe("BracketSkeleton", () => {
  it("renders placeholders", () => {
    const { container } = render(<BracketSkeleton />);
    expect(container.querySelectorAll("[data-slot='skeleton']").length).toBe(3);
  });
});
