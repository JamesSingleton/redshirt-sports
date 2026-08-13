import { type Mock, vi } from "vitest";

export type SanityMocks = {
  sanityFetch: Mock;
  getDynamicFetchOptions: Mock;
  urlForImage: Mock;
};

/** Factory for Sanity client mocks — call inside `vi.hoisted`. */
export function createSanityMocks(): SanityMocks {
  const builder = {
    width: vi.fn().mockReturnThis(),
    height: vi.fn().mockReturnThis(),
    fit: vi.fn().mockReturnThis(),
    auto: vi.fn().mockReturnThis(),
    quality: vi.fn().mockReturnThis(),
    url: vi.fn(() => "https://cdn.sanity.io/images/test/image.jpg"),
  };

  return {
    sanityFetch: vi.fn(async ({ query: _query }: { query: string }) => ({
      data: null,
    })),
    getDynamicFetchOptions: vi.fn(async () => ({
      perspective: "published",
      stega: false,
    })),
    urlForImage: vi.fn(() => builder),
  };
}
