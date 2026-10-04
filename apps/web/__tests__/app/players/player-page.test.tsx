import { render, screen, within } from "@testing-library/react";
import { isValidElement, type ReactElement, type ReactNode } from "react";

import type { getCachedPlayer } from "@/lib/transfer-portal";
import {
  portalEntry,
  portalPlayer,
  portalSchool,
} from "../../helpers/transfer-portal-fixtures";

type PlayerData = NonNullable<Awaited<ReturnType<typeof getCachedPlayer>>>;
type Player = PlayerData["player"];

const { mockGetCachedPlayer } = vi.hoisted(() => ({
  mockGetCachedPlayer: vi.fn(),
}));

vi.mock("@/lib/transfer-portal", () => ({
  getCachedPlayer: mockGetCachedPlayer,
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/sanity-image", () => ({
  __esModule: true,
  default: () => <img alt="" data-testid="school-logo" />,
}));

vi.mock("@/components/breadcrumbs", () => ({
  __esModule: true,
  default: ({
    breadCrumbPages,
  }: {
    breadCrumbPages: { title: string; href: string }[];
  }) => (
    <nav aria-label="Breadcrumb">
      {breadCrumbPages.map((page) => (
        <a key={page.href} href={page.href}>
          {page.title}
        </a>
      ))}
    </nav>
  ),
}));

vi.mock("@/components/page-transition", () => ({
  PageTransition: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import PlayerPage, { generateMetadata } from "@/app/players/[slug]/page";

function player(overrides: Partial<Player> = {}): Player {
  return {
    ...portalPlayer(),
    hometown: "Bozeman, MT",
    sport: { id: "sport-1", slug: "football", name: "Football" },
    highSchool: {
      id: "hs-1",
      name: "Bozeman High",
      city: "Bozeman",
      state: "MT",
    },
    ...overrides,
  };
}

async function renderPlayer(slug = "jane-doe") {
  const tree = PlayerPage({ params: Promise.resolve({ slug }) });
  const child = tree.props.children;
  if (!isValidElement(child)) throw new Error("Expected PlayerContent");
  const content = child as ReactElement<{ params: Promise<{ slug: string }> }>;
  const Content = content.type as (props: {
    params: Promise<{ slug: string }>;
  }) => Promise<ReactNode>;
  const rendered = await Content(content.props);
  return render(rendered);
}

function fact(label: string) {
  return screen.getByText(label, { selector: "dt" }).nextElementSibling;
}

describe("generateMetadata", () => {
  beforeEach(() => {
    mockGetCachedPlayer.mockReset();
  });

  it("returns nothing for unknown players", async () => {
    mockGetCachedPlayer.mockResolvedValue(null);
    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "nobody" }) }),
    ).resolves.toEqual({});
    expect(mockGetCachedPlayer).toHaveBeenCalledWith("nobody");
  });

  it("names the player", async () => {
    mockGetCachedPlayer.mockResolvedValue({ player: player(), history: [] });
    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "jane-doe" }) }),
    ).resolves.toEqual({
      title: "Jane Doe Transfer Portal Profile",
      description:
        "Jane Doe transfer portal history, commitments, and profile.",
    });
  });
});

describe("PlayerPage", () => {
  beforeEach(() => {
    mockGetCachedPlayer.mockReset();
  });

  it("404s for unknown players", async () => {
    mockGetCachedPlayer.mockResolvedValue(null);
    await expect(renderPlayer("nobody")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the profile and full portal journey", async () => {
    const committed = portalEntry({
      id: "entry-2",
      status: "ENROLLED",
      committedAt: new Date("2026-01-10T00:00:00.000Z"),
      signedAt: new Date("2026-01-20T00:00:00.000Z"),
      enrolledAt: new Date("2026-06-01T00:00:00.000Z"),
      toSchool: portalSchool({
        id: "idaho",
        name: "University of Idaho",
        shortName: "Idaho",
        slug: "idaho",
        image: { asset: {} },
      }),
    });
    const withdrawn = portalEntry({
      id: "entry-1",
      portalYear: 2025,
      status: "WITHDRAWN",
      enteredAt: new Date("2025-01-05T00:00:00.000Z"),
      withdrawnAt: new Date("2025-02-01T00:00:00.000Z"),
    });
    mockGetCachedPlayer.mockResolvedValue({
      player: player({ isRedshirt: true }),
      history: [committed, withdrawn],
    });

    await renderPlayer();

    expect(
      screen.getByRole("link", { name: "Transfer portal" }),
    ).toHaveAttribute("href", "/college/football/transfer-portal");
    expect(
      screen.getByRole("heading", { level: 1, name: "Jane Doe" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Football", { selector: "p" })).toBeVisible();
    expect(screen.getAllByTestId("school-logo")).not.toHaveLength(0);
    expect(fact("Position")).toHaveTextContent("QB");
    expect(fact("Class")).toHaveTextContent("Redshirt junior");
    expect(fact("Height")).toHaveTextContent("6-2");
    expect(fact("Weight")).toHaveTextContent("210 lbs");
    expect(fact("Hometown")).toHaveTextContent("Bozeman, MT");
    expect(fact("High school")).toHaveTextContent("Bozeman High, Bozeman, MT");

    const journey = screen.getByRole("list", { name: "Portal journey" });
    const [first, second] = within(journey).getAllByRole("article");
    if (!first || !second) throw new Error("Expected two journey cards");

    expect(within(first).getByText("2026 portal")).toBeInTheDocument();
    expect(within(first).getByText("In portal")).toBeInTheDocument();
    expect(within(first).getByText("Committed")).toBeInTheDocument();
    expect(within(first).getByText("Signed")).toBeInTheDocument();
    expect(within(first).getAllByText("Enrolled")).toHaveLength(2);
    expect(within(first).getByText("Jun 1, 2026")).toHaveAttribute(
      "datetime",
      "2026-06-01T00:00:00.000Z",
    );
    expect(
      within(first).getByRole("link", { name: "More Idaho news" }),
    ).toHaveAttribute("href", "/college/teams/idaho");

    expect(within(second).getByText("2025 portal")).toBeInTheDocument();
    expect(within(second).getByText("Returning")).toBeInTheDocument();
    expect(within(second).getAllByText("Withdrawn")).toHaveLength(2);
    expect(within(second).queryByText(/news$/)).not.toBeInTheDocument();
  });

  it("falls back to the origin school logo, school name, and undecided", async () => {
    mockGetCachedPlayer.mockResolvedValue({
      player: player({
        sport: { id: "sport-2", slug: "volleyball", name: "Volleyball" },
        highSchool: {
          id: "hs-2",
          name: "Helena High",
          city: null,
          state: null,
        },
      }),
      history: [
        portalEntry({
          fromSchool: portalSchool({ image: { asset: {} } }),
        }),
        portalEntry({
          id: "entry-3",
          status: "COMMITTED",
          committedAt: new Date("2026-02-01T00:00:00.000Z"),
          toSchool: portalSchool({
            id: "unslugged",
            name: "Carroll College",
            shortName: null,
            slug: "carroll",
          }),
        }),
        portalEntry({
          id: "entry-4",
          status: "COMMITTED",
          toSchool: portalSchool({ id: "nolink", slug: null }),
        }),
      ],
    });

    await renderPlayer();

    expect(screen.getByText("Volleyball", { selector: "p" })).toBeVisible();
    expect(fact("High school")).toHaveTextContent(/^Helena High$/);
    expect(screen.getAllByTestId("school-logo").length).toBeGreaterThan(0);
    expect(screen.getByText("Undecided")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "More Carroll College news" }),
    ).toHaveAttribute("href", "/college/teams/carroll");
    expect(screen.getAllByRole("link", { name: /^More / })).toHaveLength(1);
  });

  it("handles a sparse profile with no portal history", async () => {
    mockGetCachedPlayer.mockResolvedValue({
      player: player({
        position: "",
        academicYear: null,
        heightInches: null,
        weightLbs: null,
        hometown: null,
        highSchool: null,
      }),
      history: [],
    });

    const { container } = await renderPlayer();

    expect(container.querySelector("dl")).not.toBeInTheDocument();
    expect(screen.queryByTestId("school-logo")).not.toBeInTheDocument();
    expect(
      screen.getByText("No transfer portal entries for this player yet."),
    ).toBeInTheDocument();
  });

  it("joins a high school location without a name", async () => {
    mockGetCachedPlayer.mockResolvedValue({
      player: player({
        highSchool: { id: "hs-3", name: "", city: "Missoula", state: null },
      }),
      history: [],
    });

    await renderPlayer();

    expect(fact("High school")).toHaveTextContent(/^Missoula$/);
  });
});
