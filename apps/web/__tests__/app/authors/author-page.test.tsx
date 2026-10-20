const { mockPermanentRedirect } = vi.hoisted(() => ({
  mockPermanentRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({
  permanentRedirect: mockPermanentRedirect,
}));

import AuthorPage from "@/app/authors/[slug]/page";

describe("AuthorPage (legacy)", () => {
  beforeEach(() => {
    mockPermanentRedirect.mockClear();
  });

  it("permanent-redirects to /people with slug", async () => {
    await expect(
      AuthorPage({
        params: Promise.resolve({ slug: "jane-author" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/people/jane-author");
  });

  it("preserves pagination in redirect", async () => {
    await expect(
      AuthorPage({
        params: Promise.resolve({ slug: "jane-author" }),
        searchParams: Promise.resolve({ page: "2" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/people/jane-author?page=2");
  });
});
