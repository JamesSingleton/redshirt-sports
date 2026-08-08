const { mockSanityFetch } = vi.hoisted(() => ({
  mockSanityFetch: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  sanityFetch: mockSanityFetch,
}));

import { sanityFetchPage } from "@/lib/sanity-fetch";

describe("sanityFetchPage", () => {
  beforeEach(() => {
    mockSanityFetch.mockReset();
  });

  it("delegates to sanityFetch with perspective and stega", async () => {
    mockSanityFetch.mockResolvedValue({ data: { title: "Hello" } });

    await expect(
      sanityFetchPage({
        query: '*[_type == "post"][0]',
        params: { slug: "hello" },
        perspective: "published",
        stega: false,
      }),
    ).resolves.toEqual({ data: { title: "Hello" } });

    expect(mockSanityFetch).toHaveBeenCalledWith({
      query: '*[_type == "post"][0]',
      params: { slug: "hello" },
      perspective: "published",
      stega: false,
    });
  });

  it("defaults params to an empty object", async () => {
    mockSanityFetch.mockResolvedValue({ data: null });

    await sanityFetchPage({
      query: '*[_type == "post"][0]',
      perspective: "previewDrafts",
      stega: true,
    });

    expect(mockSanityFetch).toHaveBeenCalledWith({
      query: '*[_type == "post"][0]',
      params: {},
      perspective: "previewDrafts",
      stega: true,
    });
  });
});
