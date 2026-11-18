const { mockSanityFetch, mockSanityRemote } = vi.hoisted(() => ({
  mockSanityFetch: vi.fn(),
  mockSanityRemote: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  cachedSanity: mockSanityFetch,
  cachedSanityRemote: mockSanityRemote,
}));

import { sanityFetchPage, sanityFetchRequestTime } from "@/lib/sanity-fetch";

describe("sanityFetchPage", () => {
  it("reads with the page's perspective, so drafts show only in preview", async () => {
    mockSanityFetch.mockReset().mockResolvedValue({ data: { title: "Draft" } });
    await expect(
      sanityFetchPage({ query: "post", perspective: "drafts", stega: true }),
    ).resolves.toEqual({ data: { title: "Draft" } });
    expect(mockSanityFetch).toHaveBeenCalledWith({
      query: "post",
      params: {},
      perspective: "drafts",
      stega: true,
    });
  });
});

describe("sanityFetchRequestTime", () => {
  beforeEach(() => {
    mockSanityFetch.mockReset();
    mockSanityRemote.mockReset();
  });

  it("reads published content from the shared remote cache", async () => {
    mockSanityRemote.mockResolvedValue({ data: [] });

    await expect(
      sanityFetchRequestTime({
        query: "ads",
        params: { placement: "home-sidebar" },
        perspective: "published",
        stega: false,
      }),
    ).resolves.toEqual({ data: [] });

    expect(mockSanityRemote).toHaveBeenCalledWith({
      query: "ads",
      params: { placement: "home-sidebar" },
    });
    expect(mockSanityFetch).not.toHaveBeenCalled();
  });

  it("keeps draft preview off the remote cache", async () => {
    mockSanityFetch.mockResolvedValue({ data: [] });

    await sanityFetchRequestTime({
      query: "ads",
      perspective: "drafts",
      stega: true,
    });
    await sanityFetchRequestTime({
      query: "ads",
      perspective: "published",
      stega: true,
    });

    expect(mockSanityRemote).not.toHaveBeenCalled();
    expect(mockSanityFetch).toHaveBeenNthCalledWith(1, {
      query: "ads",
      params: {},
      perspective: "drafts",
      stega: true,
    });
    expect(mockSanityFetch).toHaveBeenCalledTimes(2);
  });
});
