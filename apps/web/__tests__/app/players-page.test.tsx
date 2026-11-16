import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import {
  playerData,
  playerDoc,
  playerSport,
  recruitment,
} from "../helpers/portal-player";
import { wireData, wireRow } from "../helpers/portal-wire";

const { mockPublic, mockPlayer, mockCycles, mockWire, mockGetPageMetadata } =
  vi.hoisted(() => ({
    mockPublic: vi.fn(),
    mockPlayer: vi.fn(),
    mockCycles: vi.fn(),
    mockWire: vi.fn(),
    mockGetPageMetadata: vi.fn((input: unknown) => input),
  }));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com/",
}));
vi.mock("@/lib/portal-data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/portal-data")>()),
  portalIsPublic: mockPublic,
  getCachedPortalPlayer: mockPlayer,
  getCachedPortalCycles: mockCycles,
  getCachedPortalWire: mockWire,
}));
vi.mock("@/components/live-ad-slot", () => ({
  LiveAdSlot: ({
    placement,
    sportSlugs = [],
  }: {
    placement: string;
    sportSlugs?: string[];
  }) => (
    <div
      data-testid="live-ad-slot"
      data-placement={placement}
      data-sports={sportSlugs.join(",")}
    />
  ),
}));
vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));
vi.mock("@/components/json-ld", () => ({
  JsonLdScript: ({ data, id }: { data: unknown; id: string }) => (
    <script type="application/ld+json" id={id}>
      {JSON.stringify(data)}
    </script>
  ),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  permanentRedirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    prefetch: _prefetch,
    ...rest
  }: {
    children: ReactNode;
    href: string;
    prefetch?: boolean;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import PlayerPage, { generateMetadata } from "@/app/players/[slugId]/page";
import { PlayerProfileSkeleton } from "@/components/portal/player-profile";

const params = (slugId: string) => ({ params: Promise.resolve({ slugId }) });

/** The async content the page wraps in Suspense, rendered to an element. */
async function content(slugId: string) {
  const suspense = PlayerPage(params(slugId)) as ReactElement<{
    children: ReactElement;
  }>;
  const child = suspense.props.children as ReactElement<object>;
  const Component = child.type as (props: object) => Promise<ReactElement>;
  return Component(child.props);
}

const player = (data = playerData()) => ({ kind: "player", data });

/** A career long enough to fold: next school, four colleges, high school. */
const longCareer = () =>
  playerDoc({
    hsGradYear: 2019,
    sports: [
      playerSport({
        enrollments: [
          { schoolName: "Alpha College", startYear: 2019, endYear: 2019 },
          { schoolName: "Beta College", startYear: 2020, endYear: 2021 },
          { schoolName: "Gamma College", startYear: 2022, endYear: 2023 },
          { schoolId: "montana", startYear: 2024 },
        ],
      }),
    ],
  });

describe("player profile page", () => {
  beforeEach(() => {
    mockPublic.mockReturnValue(true);
    mockPlayer.mockResolvedValue(player());
    mockCycles.mockResolvedValue({ cycles: [2026, 2025], current: 2026 });
    mockWire.mockResolvedValue(
      wireData([
        wireRow({
          eventId: 1,
          firstName: "Ann",
          lastName: "Lee",
          position: "WR",
        }),
        wireRow({
          eventId: 2,
          firstName: "Bo",
          lastName: "Cole",
          position: "QB",
        }),
      ]),
    );
  });
  afterEach(() => vi.clearAllMocks());

  it("is a real 404 while the portal is hidden", async () => {
    mockPublic.mockReturnValue(false);
    expect(() => PlayerPage(params("jalen-brooks-100000"))).toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(await generateMetadata(params("jalen-brooks-100000"))).toEqual({});
    expect(mockPlayer).not.toHaveBeenCalled();
  });

  it("404s a malformed or unknown id, looking up only the well-formed one", async () => {
    await expect(content("jalen-brooks")).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockPlayer).not.toHaveBeenCalled();
    mockPlayer.mockResolvedValueOnce(null);
    await expect(content("jalen-brooks-999999")).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(await generateMetadata(params("nope"))).toEqual({});
  });

  it("sends merged ids and stale slugs to the one address", async () => {
    const merged = { kind: "redirect", id: 100001, slug: "jalen-brooks" };
    mockPlayer.mockResolvedValueOnce(merged);
    await expect(content("jalen-brooks-100000")).rejects.toThrow(
      "REDIRECT /players/jalen-brooks-100001",
    );
    await expect(content("j-brooks-100000")).rejects.toThrow(
      "REDIRECT /players/jalen-brooks-100000",
    );
    mockPlayer.mockResolvedValueOnce(merged);
    expect(await generateMetadata(params("jalen-brooks-100000"))).toEqual({});
  });

  it("titles and canonicalizes the page; noindex until they commit", async () => {
    expect(await generateMetadata(params("jalen-brooks-100000"))).toEqual({
      title: "Jalen Brooks College Football Transfer Portal Profile",
      description: expect.stringContaining("committed to Boise State"),
      slug: "/players/jalen-brooks-100000",
      noIndex: false,
    });
    mockPlayer.mockResolvedValueOnce(player(playerData({ indexable: false })));
    expect(await generateMetadata(params("jalen-brooks-100000"))).toMatchObject(
      { noIndex: true },
    );
  });

  it("shows the header: name, position, facts, and the move", async () => {
    const { container } = render(await content("jalen-brooks-100000"));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Jalen Brooks",
    );
    expect(screen.getByText("Transfer Portal · Football")).toBeInTheDocument();
    // The position once, spelled out, then the class.
    expect(
      screen.getByText("Quarterback · Redshirt junior"),
    ).toBeInTheDocument();
    expect(screen.queryByText("QB")).toBeNull();
    // High school and hometown, as on the tracker row.
    expect(screen.getByText("Sentinel (Missoula, MT)")).toBeInTheDocument();
    expect(screen.getByText("2026 portal")).toBeInTheDocument();
    expect(screen.getByText(`6'3" / 215`)).toBeInTheDocument();
    // Only the journey's last stop now: the facts card is gone.
    expect(screen.getAllByText("Sentinel")).toHaveLength(1);
    expect(screen.getByText("New school")).toBeInTheDocument();
    expect(screen.getByText("Committed Jan 5, 2026")).toBeInTheDocument();
    // What the old status card said, now on the move card.
    expect(
      screen.getByText("Entered Jan 2, 2026 · Undergraduate transfer"),
    ).toBeInTheDocument();
    // The breadcrumb marks where you are.
    expect(
      screen.getByText("Jalen Brooks", { selector: "[aria-current]" }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
    // One page: no tabs.
    expect(screen.queryByRole("navigation", { name: "Profile" })).toBeNull();
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      within(crumbs).getByRole("link", { name: "Transfer Portal" }),
    ).toHaveAttribute("href", "/college/football/transfer-portal");

    const ld = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')!
        .textContent!,
    );
    expect(ld["@type"]).toBe("ProfilePage");
    expect(mockWire).toHaveBeenCalledWith("football", 2026);
  });

  it("shows journey, offers, and the sidebar, without repeating the move card", async () => {
    const { container } = render(await content("jalen-brooks-100000"));
    expect(screen.queryByRole("heading", { name: "Portal status" })).toBeNull();
    expect(screen.queryByText("Eligibility")).toBeNull();
    expect(screen.queryByText("Days in portal")).toBeNull();
    // No level or conference anywhere.
    expect(screen.queryByText("FCS")).toBeNull();
    expect(screen.queryByText(/Big Sky/)).toBeNull();

    expect(screen.getByText("3 stops · newest first")).toBeInTheDocument();
    expect(screen.getByText("Next school")).toBeInTheDocument();
    expect(screen.getByText("Entered portal")).toBeInTheDocument();
    expect(screen.getByText("Missoula, MT · high school")).toBeInTheDocument();

    expect(screen.getByText("1 school reported")).toBeInTheDocument();
    expect(screen.queryByText("Conference")).toBeNull();
    expect(container.querySelector("caption")).toHaveTextContent(
      "Schools reported to have offered",
    );

    expect(
      screen.getByRole("heading", { name: "Montana portal moves" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "More quarterbacks in the portal" }),
    ).toBeInTheDocument();
    // In both lists: he left Montana and plays QB. The initials aren't read out.
    expect(screen.getAllByRole("link", { name: /Bo Cole/ })).toHaveLength(2);
    expect(
      screen
        .getAllByRole("link", { name: /Bo Cole/ })[0]!
        .querySelector("[aria-hidden]"),
    ).toHaveTextContent("BC");
    expect(screen.getAllByRole("link", { name: /Bo Cole/ })[0]).toHaveAttribute(
      "href",
      "/players/jalen-brooks-100002",
    );
  });

  it("folds two empty lists into one card", async () => {
    mockWire.mockResolvedValue(wireData([]));
    render(await content("jalen-brooks-100000"));
    expect(
      screen.getByRole("heading", { name: "Around the portal" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Montana portal moves" }),
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: /Montana in the tracker/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Full portal tracker/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No other Montana players in the 2026 portal yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No other quarterbacks in the 2026 portal yet."),
    ).toBeInTheDocument();
  });

  it("folds a long journey behind Show all", async () => {
    mockPlayer.mockResolvedValueOnce(player(playerData({ doc: longCareer() })));
    render(await content("jalen-brooks-100000"));
    expect(screen.getByText("6 stops · newest first")).toBeInTheDocument();
    expect(screen.queryByText("Alpha College")).toBeNull();
    const more = screen.getByRole("button", { name: /Show all 6 stops/ });
    expect(more).toHaveTextContent("Earlier: Alpha College, Sentinel");
    fireEvent.click(more);
    // Focus lands where the new stops start, not at the top of the page.
    expect(document.activeElement).toHaveTextContent("Showing all 6 stops");
    expect(screen.getByText("Alpha College")).toBeInTheDocument();
    expect(screen.getByText("Class of 2019")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Show all/ })).toBeNull();
  });

  it("shows one stop past the fold rather than folding it alone", async () => {
    const doc = longCareer();
    doc.highSchoolName = undefined;
    mockPlayer.mockResolvedValueOnce(player(playerData({ doc })));
    render(await content("jalen-brooks-100000"));
    expect(screen.getByText("5 stops · newest first")).toBeInTheDocument();
    expect(screen.getByText("Alpha College")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Show all/ })).toBeNull();
  });

  it("shows withdrawals, grad transfers, and every offer", async () => {
    const doc = playerDoc({
      sports: [
        playerSport({
          recruitments: [
            recruitment({
              id: 2,
              status: "withdrawn",
              isGradTransfer: true,
              classAtEntry: undefined,
              offers: [
                {
                  eventId: 30,
                  occurredAt: "2026-01-03T17:00:00.000Z",
                  schoolName: "Carroll College",
                },
                {
                  eventId: 31,
                  occurredAt: "2026-01-03T17:00:00.000Z",
                  schoolName: "Rocky Mountain",
                },
                {
                  eventId: 32,
                  occurredAt: "2026-01-03T17:00:00.000Z",
                  schoolName: "Montana Tech",
                },
                { eventId: 33, occurredAt: "2026-01-03T17:00:00.000Z" },
              ],
            }),
            recruitment({ id: 1, cycleYear: 2024, status: "enrolled" }),
          ],
        }),
      ],
    });
    mockPlayer.mockResolvedValue(player(playerData({ doc })));
    render(await content("jalen-brooks-100000"));
    expect(
      screen.getByRole("img", {
        name: "Grad transfer: earned a degree before transferring",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Returning to Montana")).toBeInTheDocument();
    expect(
      screen.getByText("Entered Jan 2, 2026 · Graduate transfer"),
    ).toBeInTheDocument();
    expect(screen.getByText("5 schools reported")).toBeInTheDocument();
    // An offer with no school, and one from an earlier cycle.
    expect(screen.getByText("Undisclosed")).toBeInTheDocument();
    expect(screen.getByText("(2024)")).toBeInTheDocument();
  });

  it("handles a player with little on record", async () => {
    mockWire.mockResolvedValue(wireData([]));
    mockPlayer.mockResolvedValueOnce(
      player(
        playerData({
          doc: playerDoc({
            highSchoolName: undefined,
            hometownCity: undefined,
            hometownState: undefined,
            sports: [
              playerSport({
                position: undefined,
                heightIn: undefined,
                weightLb: undefined,
                enrollments: [],
                recruitments: [
                  recruitment({
                    status: "entered",
                    classAtEntry: undefined,
                    destination: undefined,
                    offers: [],
                  }),
                ],
              }),
            ],
          }),
        }),
      ),
    );
    render(await content("jalen-brooks-100000"));
    expect(screen.getAllByText("Undecided").length).toBeGreaterThan(0);
    expect(screen.getByText("Next school")).toBeInTheDocument();
    expect(screen.queryByText(/Quarterback/)).toBeNull();
    expect(screen.queryByText("Reported offers")).toBeNull();

    // No sports at all: just the name.
    mockPlayer.mockResolvedValueOnce(
      player(
        playerData({
          doc: playerDoc({
            highSchoolName: undefined,
            hometownCity: undefined,
            hometownState: undefined,
            sports: [],
          }),
        }),
      ),
    );
    render(await content("jalen-brooks-100000"));
    expect(
      screen.getByText("No portal moves on record yet."),
    ).toBeInTheDocument();

    // A sport we don't track: no cycles, no wire, no sidebar.
    mockPlayer.mockResolvedValueOnce(
      player(
        playerData({
          doc: playerDoc({
            sports: [
              playerSport({
                sportSlug: "lacrosse",
                position: "ZZ",
                recruitments: [],
              }),
            ],
          }),
        }),
      ),
    );
    const lax = render(await content("jalen-brooks-100000"));
    expect(lax.container.querySelector("aside h2")).toBeNull();
    expect(mockCycles).not.toHaveBeenCalledWith("lacrosse");
  });

  it("copes with unknown schools and positions, dropped moves, and an empty journey", async () => {
    // An unknown origin, an odd position code, a class, a dropped commitment.
    mockPlayer.mockResolvedValueOnce(
      player(
        playerData({
          doc: playerDoc({
            sports: [
              playerSport({
                position: "ZZ",
                enrollments: [{ schoolId: "montana", startYear: 2024 }],
                recruitments: [
                  recruitment({
                    origin: { schoolId: "montana" },
                    events: [
                      {
                        id: 1,
                        type: "entered",
                        occurredAt: "2026-01-02T17:00:00.000Z",
                        superseded: false,
                      },
                      {
                        id: 2,
                        type: "committed",
                        occurredAt: "2026-01-03T17:00:00.000Z",
                        schoolName: "Idaho",
                        superseded: true,
                      },
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      ),
    );
    const odd = render(await content("jalen-brooks-100000"));
    // A code we can't spell out shows as the code.
    expect(screen.getByText("ZZ · Redshirt junior")).toBeInTheDocument();
    expect(screen.getByText("Committed to Idaho")).toHaveClass("line-through");
    // Said in words too: strikethrough isn't announced.
    expect(screen.getByText("Dropped")).toBeInTheDocument();
    odd.unmount();

    // Nothing known about where they came from, and no position.
    mockPlayer.mockResolvedValueOnce(
      player(
        playerData({
          doc: playerDoc({
            sports: [
              playerSport({
                position: undefined,
                recruitments: [recruitment({ origin: {} })],
              }),
            ],
          }),
        }),
      ),
    );
    const unknown = render(await content("jalen-brooks-100000"));
    expect(
      within(unknown.container).getByText("Undisclosed"),
    ).toBeInTheDocument();
    expect(
      within(unknown.container).getByText("Redshirt junior"),
    ).toBeInTheDocument();
    unknown.unmount();

    // Enrolled with no schools on record: no journey stops at all.
    mockPlayer.mockResolvedValueOnce(
      player(
        playerData({
          doc: playerDoc({
            highSchoolName: undefined,
            sports: [
              playerSport({
                enrollments: [],
                recruitments: [recruitment({ status: "enrolled" })],
              }),
            ],
          }),
        }),
      ),
    );
    const enrolled = render(await content("jalen-brooks-100000"));
    expect(screen.getByText("Enrolled Jan 5, 2026")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Journey" })).toBeNull();
    enrolled.unmount();

    // The tracker has no wire for the cycle: no sidebar lists.
    mockWire.mockResolvedValueOnce(null);
    const nowire = render(await content("jalen-brooks-100000"));
    expect(nowire.container.querySelector("aside h2")).toBeNull();
  });

  it("marks the headshot with the logo of the school they're headed to", async () => {
    const data = playerData();
    const logo = {
      asset: { _ref: "image-abc-200x200-svg", _type: "reference" },
    };
    data.schools = {
      ...data.schools,
      boise: { ...data.schools.boise!, image: logo },
    };
    mockPlayer.mockResolvedValueOnce(player(data));
    const { container } = render(await content("jalen-brooks-100000"));
    const watermark = container.querySelector(
      'img[aria-hidden="true"][alt=""]',
    );
    expect(watermark).not.toBeNull();
  });

  it("renders the skeleton", () => {
    const { container } = render(<PlayerProfileSkeleton />);
    expect(container.querySelector("[aria-busy]")).not.toBeNull();
  });
});
