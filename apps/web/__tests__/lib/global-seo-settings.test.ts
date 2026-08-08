const { mockSanityFetchMetadata } = vi.hoisted(() => ({
  mockSanityFetchMetadata: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  sanityFetchMetadata: mockSanityFetchMetadata,
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
    mockSanityFetchMetadata.mockResolvedValue({
      data: { siteBrand: "Redshirt Sports" },
    });

    await expect(fetchGlobalSeoSettings()).resolves.toEqual({
      siteBrand: "Redshirt Sports",
    });
    expect(mockSanityFetchMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ perspective: "published" }),
    );
  });

  it("fetchGlobalSeoSettings passes custom perspective", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: null });
    await fetchGlobalSeoSettings("previewDrafts");
    expect(mockSanityFetchMetadata).toHaveBeenCalledWith(
      expect.objectContaining({ perspective: "previewDrafts" }),
    );
  });

  it("getPageMetadata merges settings with page data", async () => {
    mockSanityFetchMetadata.mockResolvedValue({
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
    mockSanityFetchMetadata.mockResolvedValue({
      data: {
        siteBrand: "From Settings",
        defaultOpenGraphImage: { asset: { _ref: "settings-img" } },
      },
    });

    await getPageMetadata({
      title: "About",
      siteBrand: "Override Brand",
      defaultOpenGraphImage: { asset: { _ref: "page-img" } },
    });

    expect(getSEOMetadata).toHaveBeenCalledWith({
      title: "About",
      siteBrand: "Override Brand",
      defaultOpenGraphImage: { asset: { _ref: "page-img" } },
    });
  });

  it("getPageMetadata handles missing settings", async () => {
    mockSanityFetchMetadata.mockResolvedValue({ data: null });

    await getPageMetadata({});

    expect(getSEOMetadata).toHaveBeenCalledWith({
      defaultOpenGraphImage: undefined,
      siteBrand: undefined,
    });
  });
});
