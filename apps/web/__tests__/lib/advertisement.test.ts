import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";

const { mockSanityFetchPage } = vi.hoisted(() => ({
  mockSanityFetchPage: vi.fn(),
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchPage: mockSanityFetchPage,
}));

import {
  loadAdvertisement,
  toAdvertisementCreative,
} from "@/lib/advertisement";

const published: DynamicFetchOptions = {
  perspective: "published",
  stega: false,
};

const creative = {
  _id: "ad-1",
  sponsorName: "Nike",
  href: "https://nike.example/fcs",
  openInNewTab: false,
  image: { id: "image-abc", alt: "Nike swoosh" },
};

describe("toAdvertisementCreative", () => {
  it("accepts an https creative", () => {
    expect(toAdvertisementCreative(creative)).toMatchObject({
      id: "ad-1",
      sponsorName: "Nike",
      href: "https://nike.example/fcs",
      image: { alt: "Nike swoosh" },
    });
  });

  it("accepts a site path", () => {
    expect(
      toAdvertisementCreative({ ...creative, href: "/college/football/news" }),
    ).toMatchObject({ href: "/college/football/news" });
  });

  it("rejects missing, unsafe, and incomplete creatives", () => {
    expect(toAdvertisementCreative(null)).toBeNull();
    expect(toAdvertisementCreative([])).toBeNull();
    expect(
      toAdvertisementCreative({ ...creative, href: "javascript:alert(1)" }),
    ).toBeNull();
    expect(
      toAdvertisementCreative({ ...creative, href: "//evil.example" }),
    ).toBeNull();
    expect(
      toAdvertisementCreative({ ...creative, sponsorName: " " }),
    ).toBeNull();
    expect(
      toAdvertisementCreative({
        ...creative,
        image: { alt: "Nike swoosh" },
      }),
    ).toBeNull();
    expect(toAdvertisementCreative({ ...creative, sponsorName: 1 })).toBeNull();
    expect(toAdvertisementCreative({ ...creative, href: 1 })).toBeNull();
    expect(
      toAdvertisementCreative({ ...creative, href: "not a url" }),
    ).toBeNull();
    expect(
      toAdvertisementCreative({ ...creative, href: "http://sponsor.example" }),
    ).toMatchObject({ href: "http://sponsor.example" });
    expect(toAdvertisementCreative({ ...creative, image: null })).toBeNull();
    expect(toAdvertisementCreative({ ...creative, image: {} })).toBeNull();
    expect(
      toAdvertisementCreative({ ...creative, image: { id: "" } }),
    ).toBeNull();
  });

  it("uses the image id when the document id is missing", () => {
    const { _id: _ignored, ...withoutId } = creative;
    expect(toAdvertisementCreative(withoutId)).toMatchObject({
      id: "image-abc",
    });
  });

  it("fills alt text from the sponsor name", () => {
    expect(
      toAdvertisementCreative({
        ...creative,
        image: { id: "image-abc", alt: "  " },
      }),
    ).toMatchObject({
      image: { alt: "Nike advertisement" },
    });
  });
});

describe("loadAdvertisement", () => {
  beforeEach(() => {
    mockSanityFetchPage.mockReset();
  });

  it("returns null when Sanity has no match", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: null });

    await expect(
      loadAdvertisement({
        placement: "home-sidebar",
        fetchOptions: published,
      }),
    ).resolves.toBeNull();

    expect(mockSanityFetchPage).toHaveBeenCalledWith(
      expect.objectContaining({
        params: {
          placement: "home-sidebar",
          sportSlugs: [],
          includeScheduled: false,
        },
        perspective: "published",
        stega: false,
      }),
    );
  });

  it("includes scheduled sponsorships while previewing drafts", async () => {
    mockSanityFetchPage.mockResolvedValue({ data: creative });

    await expect(
      loadAdvertisement({
        placement: "article-sidebar",
        sportSlugs: ["football"],
        fetchOptions: { perspective: "drafts", stega: true },
      }),
    ).resolves.toMatchObject({ sponsorName: "Nike" });

    expect(mockSanityFetchPage).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          includeScheduled: true,
          sportSlugs: ["football"],
        }),
      }),
    );
  });

  it("returns null when the fetch result has no data payload", async () => {
    mockSanityFetchPage.mockResolvedValueOnce(undefined);
    await expect(
      loadAdvertisement({
        placement: "team-sidebar",
        fetchOptions: published,
      }),
    ).resolves.toBeNull();

    mockSanityFetchPage.mockResolvedValue({});

    await expect(
      loadAdvertisement({
        placement: "team-sidebar",
        fetchOptions: published,
      }),
    ).resolves.toBeNull();
  });
});
