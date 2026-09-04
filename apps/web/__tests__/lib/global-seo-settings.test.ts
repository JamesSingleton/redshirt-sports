const { mockSanityFetch } = vi.hoisted(() => ({
  mockSanityFetch: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  sanityFetch: mockSanityFetch,
}));

vi.mock("@/lib/seo", () => ({
  getSEOMetadata: vi.fn((data) => ({ title: data.title ?? "Default" })),
}));

import {
  fetchGlobalSeoSettings,
  getPageMetadata,
} from "@/lib/global-seo-settings";
import { getSEOMetadata } from "@/lib/seo";

describe("global-seo-settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchGlobalSeoSettings returns Sanity data", async () => {
    mockSanityFetch.mockResolvedValue({
      data: { siteBrand: "Redshirt Sports" },
    });

    await expect(fetchGlobalSeoSettings()).resolves.toEqual({
      siteBrand: "Redshirt Sports",
    });
    expect(mockSanityFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        perspective: "published",
        stega: false,
      }),
    );
  });

  it("fetchGlobalSeoSettings passes custom perspective", async () => {
    mockSanityFetch.mockResolvedValue({ data: null });
    await fetchGlobalSeoSettings("previewDrafts");
    expect(mockSanityFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        perspective: "previewDrafts",
        stega: false,
      }),
    );
  });

  it("getPageMetadata merges settings with page data", async () => {
    mockSanityFetch.mockResolvedValue({
      data: {
        siteBrand: "From Settings",
        defaultOpenGraphImage: { asset: { _ref: "img" } },
      },
    });

    await getPageMetadata({ title: "About" });

    expect(getSEOMetadata).toHaveBeenCalledWith({
      title: "About",
      defaultOpenGraphImage: { asset: { _ref: "img" } },
      siteBrand: "From Settings",
    });
  });

  it("getPageMetadata prefers explicit page overrides over settings", async () => {
    mockSanityFetch.mockResolvedValue({
      data: {
        siteBrand: "From Settings",
        defaultOpenGraphImage: { asset: { _ref: "settings-img" } },
      },
    });

    await getPageMetadata({
      title: "About",
      siteBrand: "Override Brand",
      defaultOpenGraphImage: "page-img",
    });

    expect(getSEOMetadata).toHaveBeenCalledWith({
      title: "About",
      siteBrand: "Override Brand",
      defaultOpenGraphImage: "page-img",
    });
  });

  it("getPageMetadata handles missing settings", async () => {
    mockSanityFetch.mockResolvedValue({ data: null });

    await getPageMetadata({});

    expect(getSEOMetadata).toHaveBeenCalledWith({
      defaultOpenGraphImage: undefined,
      siteBrand: undefined,
    });
  });
});
