import { CONTENT_CACHE_LIFE } from "@/lib/content-cache-life";

describe("CONTENT_CACHE_LIFE", () => {
  it("defines long-lived cache TTLs for layout chrome", () => {
    expect(CONTENT_CACHE_LIFE).toEqual({
      stale: 300,
      revalidate: 604800,
      expire: 2592000,
    });
  });
});
