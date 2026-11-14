import { render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { wireData, wireRow } from "../../helpers/portal-wire";

const { mockPublic, mockCycles, mockWire, mockGetPageMetadata } = vi.hoisted(
  () => ({
    mockPublic: vi.fn(),
    mockCycles: vi.fn(),
    mockWire: vi.fn(),
    mockGetPageMetadata: vi.fn((input: unknown) => input),
  }),
);

vi.mock("@/lib/portal-data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/portal-data")>()),
  portalIsPublic: mockPublic,
  getCachedPortalCycles: mockCycles,
  getCachedPortalWire: mockWire,
}));
vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));
vi.mock("@/components/portal/wire-view", () => ({
  WireView: (props: {
    initialCounts: unknown;
    totalPlayers: number;
    jsonUrl: string;
    initial: { rows: unknown[] };
  }) => (
    <div
      data-testid="wire-view"
      data-total={props.totalPlayers}
      data-counts={JSON.stringify(props.initialCounts)}
      data-json={props.jsonUrl}
      data-initial={props.initial.rows.length}
    />
  ),
}));
vi.mock("@/components/json-ld", () => ({
  JsonLdScript: ({ data, id }: { data: unknown; id: string }) => (
    <script type="application/ld+json" id={id}>
      {JSON.stringify(data)}
    </script>
  ),
}));
vi.mock("@/components/portal/wire-scope", () => ({
  WireScope: (props: {
    year: number;
    years: number[];
    currentYear: number;
    sports: Array<{ slug: string; label: string }>;
  }) => (
    <div
      data-testid="wire-scope"
      data-year={props.year}
      data-years={props.years.join(",")}
      data-current={props.currentYear}
      data-sports={props.sports.map((sport) => sport.label).join("|")}
    />
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

import CyclePage, {
  generateMetadata as cycleMetadata,
} from "@/app/college/[sport]/transfer-portal/[year]/page";
import TransferPortalLayout from "@/app/college/[sport]/transfer-portal/layout";
import Loading from "@/app/college/[sport]/transfer-portal/loading";
import TransferPortalPage, {
  generateMetadata,
} from "@/app/college/[sport]/transfer-portal/page";
import { portalSportLabel } from "@/components/portal/wire-page";

/** The async content a page wraps in Suspense, rendered to an element. */
async function content(page: ReactElement) {
  const suspense = page as ReactElement<{ children: ReactElement }>;
  const child = suspense.props.children as ReactElement<object>;
  const Component = child.type as (props: object) => Promise<ReactElement>;
  const inner = await Component(child.props);
  const Wire = inner.type as (props: object) => Promise<ReactElement>;
  return Wire(inner.props as object);
}

const rows = [
  wireRow({
    eventId: 2,
    recruitmentId: 1,
    type: "committed",
    status: "committed",
  }),
  wireRow({ eventId: 1, recruitmentId: 1, status: "committed" }),
  wireRow({
    eventId: 3,
    recruitmentId: 2,
    type: "withdrew",
    status: "withdrawn",
  }),
];

describe("transfer portal pages", () => {
  beforeEach(() => {
    mockPublic.mockReturnValue(true);
    mockCycles.mockResolvedValue({ cycles: [2026, 2025], current: 2026 });
    mockWire.mockResolvedValue(wireData(rows));
  });
  afterEach(() => vi.clearAllMocks());

  it("is a real 404 while the portal is hidden", async () => {
    mockPublic.mockReturnValue(false);
    expect(() =>
      TransferPortalPage({ params: Promise.resolve({ sport: "football" }) }),
    ).toThrow("NEXT_NOT_FOUND");
    expect(() =>
      CyclePage({
        params: Promise.resolve({ sport: "football", year: "2025" }),
      }),
    ).toThrow("NEXT_NOT_FOUND");
    expect(
      await generateMetadata({
        params: Promise.resolve({ sport: "football" }),
      }),
    ).toEqual({});
    expect(
      await cycleMetadata({
        params: Promise.resolve({ sport: "football", year: "2025" }),
      }),
    ).toEqual({});
  });

  it("shows the newest cycle with its season picker and the tracker", async () => {
    render(
      await content(
        TransferPortalPage({ params: Promise.resolve({ sport: "football" }) }),
      ),
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "2026 FootballTransfer Portal",
    );
    expect(
      screen.getByRole("link", { name: "College Football" }),
    ).toHaveAttribute("href", "/college/football/news");
    expect(screen.getByTestId("wire-scope")).toHaveAttribute(
      "data-year",
      "2026",
    );
    expect(screen.getByTestId("wire-scope")).toHaveAttribute(
      "data-years",
      "2026,2025",
    );
    expect(screen.getByTestId("wire-scope")).toHaveAttribute(
      "data-sports",
      "Football|Men's Basketball|Women's Basketball",
    );
    expect(screen.getByTestId("wire-view")).toHaveAttribute(
      "data-json",
      "/api/v1/college/football/transfer-portal/2026",
    );
    expect(screen.getByTestId("wire-view")).toHaveAttribute("data-total", "2");
    expect(screen.getByTestId("wire-view")).toHaveAttribute(
      "data-counts",
      JSON.stringify({ all: 2, entered: 0, committed: 1, withdrawn: 1 }),
    );
  });

  it("describes the page in JSON-LD with its breadcrumb trail", async () => {
    const jsonLd = (container: HTMLElement) =>
      JSON.parse(
        container.querySelector('script[type="application/ld+json"]')!
          .textContent!,
      );
    const current = render(
      await content(
        TransferPortalPage({ params: Promise.resolve({ sport: "football" }) }),
      ),
    );
    const data = jsonLd(current.container);
    expect(data).toMatchObject({
      "@type": "CollectionPage",
      name: "College Football Transfer Portal 2026",
      description:
        "Every College Football player in the 2026 transfer portal: who entered, who committed where, and who withdrew.",
    });
    expect(data.url).toMatch(/\/college\/football\/transfer-portal$/);
    expect(
      data.breadcrumb.itemListElement.map(
        (item: { name: string }) => item.name,
      ),
    ).toEqual(["Home", "College", "College Football", "Transfer Portal"]);
    // The players on the page, once each, linking to their pages.
    expect(data.mainEntity).toMatchObject({
      "@type": "ItemList",
      numberOfItems: 2,
      itemListElement: [
        { position: 1, name: "Jalen Brooks" },
        { position: 2, name: "Jalen Brooks" },
      ],
    });
    expect(data.mainEntity.itemListElement[0].url).toMatch(
      /\/players\/jalen-brooks-100002$/,
    );
    current.unmount();

    const past = render(
      await content(
        CyclePage({
          params: Promise.resolve({ sport: "football", year: "2025" }),
        }),
      ),
    );
    const pastData = jsonLd(past.container);
    expect(pastData.url).toMatch(/\/transfer-portal\/2025$/);
    expect(pastData.breadcrumb.itemListElement.at(-1)).toMatchObject({
      name: "2025",
    });
  });

  it("offers the current season even before anything is published", async () => {
    mockCycles.mockResolvedValue({ cycles: [], current: 2027 });
    mockWire.mockResolvedValue(wireData([]));
    render(
      await content(
        TransferPortalPage({ params: Promise.resolve({ sport: "football" }) }),
      ),
    );
    expect(screen.getByTestId("wire-scope")).toHaveAttribute(
      "data-years",
      "2027",
    );
    expect(screen.getByTestId("wire-view")).toHaveAttribute("data-total", "0");
  });

  it("shows a past cycle and sends the current one to the bare URL", async () => {
    render(
      await content(
        CyclePage({
          params: Promise.resolve({ sport: "football", year: "2025" }),
        }),
      ),
    );
    expect(mockWire).toHaveBeenCalledWith("football", 2025);
    expect(screen.getByTestId("wire-scope")).toHaveAttribute(
      "data-year",
      "2025",
    );
    await expect(
      content(
        CyclePage({
          params: Promise.resolve({ sport: "football", year: "2026" }),
        }),
      ),
    ).rejects.toThrow("REDIRECT /college/football/transfer-portal");
  });

  it("404s an unknown sport, a bad year, an unpublished cycle, or a missing wire", async () => {
    const cases: Array<[string, string]> = [
      ["lacrosse", "2025"],
      ["football", "20x5"],
      ["football", "2019"],
    ];
    for (const [sport, year] of cases) {
      await expect(
        content(CyclePage({ params: Promise.resolve({ sport, year }) })),
      ).rejects.toThrow("NEXT_NOT_FOUND");
    }
    await expect(
      content(
        TransferPortalPage({ params: Promise.resolve({ sport: "lacrosse" }) }),
      ),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    mockWire.mockResolvedValueOnce(null);
    await expect(
      content(
        TransferPortalPage({ params: Promise.resolve({ sport: "football" }) }),
      ),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("titles each page by sport and cycle", async () => {
    expect(
      await generateMetadata({
        params: Promise.resolve({ sport: "football" }),
      }),
    ).toMatchObject({
      title: "College Football Transfer Portal 2026",
      slug: "/college/football/transfer-portal",
      noIndex: false,
    });
    // An empty cycle stays out of search until someone moves.
    mockWire.mockResolvedValueOnce(wireData([]));
    expect(
      await generateMetadata({
        params: Promise.resolve({ sport: "football" }),
      }),
    ).toMatchObject({ noIndex: true });
    mockWire.mockResolvedValueOnce(null);
    expect(
      await cycleMetadata({
        params: Promise.resolve({ sport: "football", year: "2025" }),
      }),
    ).toMatchObject({ noIndex: true });
    expect(
      await generateMetadata({
        params: Promise.resolve({ sport: "lacrosse" }),
      }),
    ).toEqual({});
    expect(
      await cycleMetadata({
        params: Promise.resolve({ sport: "mens-basketball", year: "2025" }),
      }),
    ).toMatchObject({
      title: "Men's Basketball Transfer Portal 2025",
      slug: "/college/mens-basketball/transfer-portal/2025",
      noIndex: false,
    });
    expect(
      await cycleMetadata({
        params: Promise.resolve({ sport: "football", year: "nope" }),
      }),
    ).toEqual({});
  });

  it("labels a sport it doesn't know by its slug", () => {
    expect(portalSportLabel("football")).toBe("Football");
    expect(portalSportLabel("lacrosse")).toBe("lacrosse");
  });

  it("renders the layout and loading skeleton", () => {
    render(
      <TransferPortalLayout>
        <p>child</p>
      </TransferPortalLayout>,
    );
    expect(screen.getByText("child")).toBeInTheDocument();
    const { container } = render(<Loading />);
    expect(container.querySelector("[aria-busy]")).not.toBeNull();
  });
});
