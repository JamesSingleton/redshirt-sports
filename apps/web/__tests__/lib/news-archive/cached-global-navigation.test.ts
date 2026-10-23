import { globalNavigationQuery } from "@redshirt-sports/sanity/queries";

const { mockSanityFetchPage } = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

import { getCachedGlobalNavigation } from "@/lib/news-archive/cached-global-navigation";

describe("getCachedGlobalNavigation", () => {
  it("fetches global navigation for filter chrome", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: [] });

    await getCachedGlobalNavigation({
      perspective: "published",
      stega: false,
    });

    expect(mockSanityFetchPage).toHaveBeenCalledWith({
      query: globalNavigationQuery,
      perspective: "published",
      stega: false,
    });
  });
});
