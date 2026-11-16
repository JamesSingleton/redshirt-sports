import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

const { mockGetPageMetadata } = vi.hoisted(() => ({
  mockGetPageMetadata: vi.fn(() => ({ title: "Methodology" })),
}));

vi.mock("@/lib/draft-cache", () => ({
  draftAwarePage: (
    _fallback: unknown,
    renderPage: (options: {
      perspective: string;
      stega: boolean;
    }) => Promise<unknown>,
  ) => renderPage({ perspective: "published", stega: false }),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  PUBLISHED_FETCH_OPTIONS: { perspective: "published", stega: false },
  getDynamicFetchOptions: vi.fn().mockResolvedValue({
    perspective: "published",
    stega: false,
  }),
}));

vi.mock("@/lib/global-seo-settings", () => ({
  getPageMetadata: mockGetPageMetadata,
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

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/rankings/rankings-methodology-content", () => ({
  RankingsMethodologyContent: ({ adSlot }: { adSlot: ReactNode }) => (
    <div data-testid="methodology">{adSlot}</div>
  ),
}));

import RankingsMethodologyPage, {
  generateMetadata,
} from "@/app/rankings/methodology/page";

describe("RankingsMethodologyPage", () => {
  it("describes one methodology page for every poll", async () => {
    await generateMetadata();
    expect(mockGetPageMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "How our Top 25 polls work",
        slug: "/rankings/methodology",
      }),
      "published",
    );
  });

  it("renders the shared rules and the sidebar sponsorship", async () => {
    const page = await RankingsMethodologyPage();
    render(page as ReactNode);

    expect(
      screen.getByRole("heading", { name: "How the Top 25 works" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/every sport and division/i)).toBeInTheDocument();
    expect(
      within(screen.getByTestId("methodology")).getByTestId("live-ad-slot"),
    ).toHaveAttribute("data-placement", "rankings-methodology-sidebar");
  });
});
