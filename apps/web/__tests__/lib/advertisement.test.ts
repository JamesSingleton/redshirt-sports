import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";

const { mockSanityFetchRequestTime } = vi.hoisted(() => ({
  mockSanityFetchRequestTime: vi.fn(),
}));

vi.mock("@/lib/sanity-fetch", () => ({
  sanityFetchRequestTime: mockSanityFetchRequestTime,
}));

import {
  loadAdvertisement,
  pickAdvertisement,
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

const now = new Date("2026-11-15T12:00:00Z");

describe("pickAdvertisement", () => {
  const options = { now, sportSlugs: [], includeScheduled: false };

  it("takes the first candidate, which the query orders best first", () => {
    expect(
      pickAdvertisement(
        [creative, { ...creative, _id: "ad-2", sponsorName: "Adidas" }],
        options,
      ),
    ).toMatchObject({ id: "ad-1" });
  });

  it("skips a flight that has not started or has already ended", () => {
    const upcoming = { ...creative, startsAt: "2026-11-16T00:00:00Z" };
    const over = { ...creative, endsAt: "2026-11-14T00:00:00Z" };
    const running = {
      ...creative,
      _id: "ad-3",
      startsAt: "2026-11-01T00:00:00Z",
      endsAt: "2026-11-30T00:00:00Z",
    };

    expect(pickAdvertisement([upcoming, over], options)).toBeNull();
    expect(pickAdvertisement([upcoming, over, running], options)).toMatchObject(
      { id: "ad-3" },
    );
  });

  it("starts and ends a flight on the exact minute", () => {
    const flight = {
      ...creative,
      startsAt: "2026-11-15T12:00:00Z",
      endsAt: "2026-11-15T12:00:00Z",
    };

    expect(pickAdvertisement([flight], options)).not.toBeNull();
    expect(
      pickAdvertisement([flight], {
        ...options,
        now: new Date("2026-11-15T11:59:59Z"),
      }),
    ).toBeNull();
    expect(
      pickAdvertisement([flight], {
        ...options,
        now: new Date("2026-11-15T12:00:01Z"),
      }),
    ).toBeNull();
  });

  it("shows a scheduled flight early in draft preview", () => {
    const upcoming = { ...creative, startsAt: "2026-12-01T00:00:00Z" };

    expect(
      pickAdvertisement([upcoming], { ...options, includeScheduled: true }),
    ).toMatchObject({ id: "ad-1" });
  });

  it("keeps a sport-limited sponsorship off other sports' pages", () => {
    const football = { ...creative, sportSlugs: ["football"] };

    expect(pickAdvertisement([football], options)).toBeNull();
    expect(
      pickAdvertisement([football], {
        ...options,
        sportSlugs: ["mens-basketball"],
      }),
    ).toBeNull();
    expect(
      pickAdvertisement([football], { ...options, sportSlugs: ["football"] }),
    ).toMatchObject({ id: "ad-1" });
  });

  it("shows a sponsorship with no sports everywhere", () => {
    for (const sportSlugs of [undefined, null, []]) {
      expect(
        pickAdvertisement([{ ...creative, sportSlugs }], {
          ...options,
          sportSlugs: ["football"],
        }),
      ).toMatchObject({ id: "ad-1" });
    }
  });

  it("passes over a candidate it cannot render", () => {
    expect(
      pickAdvertisement(
        [null, { ...creative, href: "javascript:alert(1)" }, creative],
        options,
      ),
    ).toMatchObject({ id: "ad-1" });
  });

  it("returns null when the result is not a list", () => {
    expect(pickAdvertisement(null, options)).toBeNull();
    expect(pickAdvertisement(creative, options)).toBeNull();
  });
});

describe("loadAdvertisement", () => {
  beforeEach(() => {
    mockSanityFetchRequestTime.mockReset();
  });

  it("asks for the placement only, so one cached list serves every page", async () => {
    mockSanityFetchRequestTime.mockResolvedValue({ data: [] });

    await expect(
      loadAdvertisement({
        placement: "home-sidebar",
        sportSlugs: ["football"],
        fetchOptions: published,
        now,
      }),
    ).resolves.toBeNull();

    expect(mockSanityFetchRequestTime).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { placement: "home-sidebar" },
        perspective: "published",
        stega: false,
      }),
    );
  });

  it("hides a scheduled sponsorship from readers and shows it in draft preview", async () => {
    mockSanityFetchRequestTime.mockResolvedValue({
      data: [{ ...creative, startsAt: "2026-12-01T00:00:00Z" }],
    });

    await expect(
      loadAdvertisement({
        placement: "article-sidebar",
        fetchOptions: published,
        now,
      }),
    ).resolves.toBeNull();

    await expect(
      loadAdvertisement({
        placement: "article-sidebar",
        fetchOptions: { perspective: "drafts", stega: true },
        now,
      }),
    ).resolves.toMatchObject({ sponsorName: "Nike" });
  });

  it("returns null when the fetch result has no data payload", async () => {
    mockSanityFetchRequestTime.mockResolvedValueOnce(undefined);
    await expect(
      loadAdvertisement({
        placement: "team-sidebar",
        fetchOptions: published,
        now,
      }),
    ).resolves.toBeNull();

    mockSanityFetchRequestTime.mockResolvedValue({});

    await expect(
      loadAdvertisement({
        placement: "team-sidebar",
        fetchOptions: published,
        now,
      }),
    ).resolves.toBeNull();
  });
});
