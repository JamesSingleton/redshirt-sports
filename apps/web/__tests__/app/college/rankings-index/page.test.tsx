import { render, screen } from "@testing-library/react";
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
  Suspense,
} from "react";

const { mockGetPageMetadata, mockNotFound } = vi.hoisted(() => ({
  mockGetPageMetadata: vi.fn(() => ({ title: "Rankings" })),
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  PUBLISHED_FETCH_OPTIONS: { perspective: "published", stega: false },
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("@/components/rankings/top25-card", () => ({
  FOOTBALL_POLL_DIVISIONS: [
    { slug: "fcs", label: "FCS" },
    { slug: "fbs", label: "FBS" },
  ],
  DivisionTop25Card: ({ division }: { division: string }) => (
    <div data-testid="division-card">{division}</div>
  ),
  DivisionTop25CardSkeleton: () => <div data-testid="card-skeleton" />,
}));

vi.mock("@/components/suspense-reveal", () => ({
  SuspenseReveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import RankingsIndexPage, {
  generateMetadata,
} from "@/app/college/[sport]/rankings/page";

type SuspenseProps = { fallback: ReactNode; children: ReactElement };

function findSuspense(node: ReactNode): ReactElement<SuspenseProps> | null {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<{ children?: ReactNode }>(child)) continue;
    if (child.type === Suspense) return child as ReactElement<SuspenseProps>;
    const nested = findSuspense(child.props.children);
    if (nested) return nested;
  }
  return null;
}

function getSuspense(sport: string) {
  const page = RankingsIndexPage({ params: Promise.resolve({ sport }) });
  const suspense = findSuspense(page);
  if (!suspense) throw new Error("No Suspense boundary");
  return suspense;
}

async function renderIndex(sport: string) {
  const { children } = getSuspense(sport).props;
  const Index = children.type as (props: unknown) => Promise<ReactNode>;
  return render(await Index(children.props));
}

describe("RankingsIndexPage", () => {
  beforeEach(() => {
    mockNotFound.mockClear();
  });

  it("generateMetadata builds the rankings index metadata", async () => {
    await generateMetadata({ params: Promise.resolve({ sport: "football" }) });

    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "College Football Top 25 Rankings",
        slug: "/college/football/rankings",
      }),
      "published",
    );
  });

  it("falls back to a skeleton per division while polls load", () => {
    render(getSuspense("football").props.fallback);
    expect(screen.getAllByTestId("card-skeleton")).toHaveLength(2);
  });

  it("renders a poll card for every football division", async () => {
    await renderIndex("football");

    expect(
      screen.getAllByTestId("division-card").map((card) => card.textContent),
    ).toEqual(["fcs", "fbs"]);
  });

  it("throws notFound for sports without polls", async () => {
    await expect(renderIndex("basketball")).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
