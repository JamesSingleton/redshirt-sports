const { mockDraftMode, mockGetDynamicFetchOptions } = vi.hoisted(() => ({
  mockDraftMode: vi.fn(),
  mockGetDynamicFetchOptions: vi.fn(),
}));

vi.mock("next/headers", () => ({
  draftMode: mockDraftMode,
}));

vi.mock("@redshirt-sports/sanity/live", () => ({
  PUBLISHED_FETCH_OPTIONS: {
    perspective: "published",
    stega: false,
  },
  getDynamicFetchOptions: mockGetDynamicFetchOptions,
}));

import { resolveDynamicFetchOptions } from "@/lib/resolve-dynamic-fetch-options";

describe("resolveDynamicFetchOptions", () => {
  beforeEach(() => {
    mockDraftMode.mockReset();
    mockGetDynamicFetchOptions.mockReset();
  });

  it("returns published options when draft mode is off", async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: false });

    await expect(resolveDynamicFetchOptions()).resolves.toEqual({
      perspective: "published",
      stega: false,
    });
    expect(mockGetDynamicFetchOptions).not.toHaveBeenCalled();
  });

  it("loads dynamic options when draft mode is on", async () => {
    mockDraftMode.mockResolvedValue({ isEnabled: true });
    mockGetDynamicFetchOptions.mockResolvedValue({
      perspective: "previewDrafts",
      stega: true,
    });

    await expect(resolveDynamicFetchOptions()).resolves.toEqual({
      perspective: "previewDrafts",
      stega: true,
    });
  });
});
