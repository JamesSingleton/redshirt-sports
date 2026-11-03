import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  bracketEdition,
  bracketView,
} from "@/__tests__/helpers/bracket-fixtures";
import { resolveSuspense } from "@/__tests__/helpers/ratings-fixtures";

const data = vi.hoisted(() => ({
  loadBracketPage: vi.fn(),
  loadLatestBracketPage: vi.fn(),
}));
const mockGetPageMetadata = vi.hoisted(() => vi.fn((input: unknown) => input));

vi.mock("@/lib/bracket-data", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/bracket-data")>()),
  ...data,
}));
vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
}));
vi.mock("@/components/bracket/bracket-page-view", () => ({
  bracketTitle: () => "2026 FCS Playoff Bracket",
  BracketPageView: ({ model }: { model: { edition: { id: string } } }) => (
    <div data-testid="view">{model.edition.id}</div>
  ),
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

import SeasonPage, {
  generateMetadata as seasonMetadata,
} from "@/app/college/[sport]/playoffs/[division]/[year]/page";
import ProjectionPage, {
  generateMetadata as projectionMetadata,
} from "@/app/college/[sport]/playoffs/[division]/[year]/projections/[week]/page";
import DivisionLayout from "@/app/college/[sport]/playoffs/[division]/layout";
import LandingPage, {
  generateMetadata as landingMetadata,
} from "@/app/college/[sport]/playoffs/[division]/page";

const model = {
  edition: bracketEdition(),
  view: bracketView(),
  official: null,
  projections: [bracketEdition()],
  seasons: [2026],
};

describe("playoff bracket pages", () => {
  beforeEach(() => {
    data.loadBracketPage.mockReset().mockResolvedValue(model);
    mockGetPageMetadata.mockClear();
  });

  it("wraps pages in a full-width layout", () => {
    render(<DivisionLayout>child</DivisionLayout>);
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("renders the season bracket and its metadata", async () => {
    const params = Promise.resolve({
      sport: "football",
      division: "fcs",
      year: "2026",
    });
    render(await resolveSuspense(SeasonPage({ params })));
    expect(screen.getByTestId("view")).toHaveTextContent("edition-1");
    await expect(seasonMetadata({ params })).resolves.toMatchObject({
      title: "2026 FCS Playoff Bracket",
      slug: "/college/football/playoffs/fcs/2026",
    });
  });

  it("renders one week's projection and its metadata", async () => {
    const params = Promise.resolve({
      sport: "football",
      division: "fcs",
      year: "2026",
      week: "week-7",
    });
    render(await resolveSuspense(ProjectionPage({ params })));
    expect(data.loadBracketPage).toHaveBeenCalledWith({
      sport: "football",
      division: "fcs",
      year: "2026",
      week: "week-7",
    });
    await expect(projectionMetadata({ params })).resolves.toMatchObject({
      title: "2026 FCS Playoff Bracket: Projection after Week 7",
      slug: "/college/football/playoffs/fcs/2026/projections/week-7",
    });
  });

  it("renders the latest bracket on the division landing page", async () => {
    data.loadLatestBracketPage.mockResolvedValue(model);
    const params = Promise.resolve({ sport: "football", division: "fcs" });
    render(await resolveSuspense(LandingPage({ params })));
    expect(screen.getByTestId("view")).toHaveTextContent("edition-1");
    expect(data.loadLatestBracketPage).toHaveBeenCalledWith({
      sport: "football",
      division: "fcs",
    });
    await expect(landingMetadata({ params })).resolves.toMatchObject({
      title: "2026 FCS Playoff Bracket",
      slug: "/college/football/playoffs/fcs",
    });
  });
});
