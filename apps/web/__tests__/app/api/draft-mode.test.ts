const { mockDisable, mockRedirect, mockDefineEnableDraftMode } = vi.hoisted(
  () => ({
    mockDisable: vi.fn(),
    mockRedirect: vi.fn(() => {
      throw new Error("NEXT_REDIRECT:/");
    }),
    mockDefineEnableDraftMode: vi.fn(() => ({
      GET: vi.fn(async () => new Response("enabled")),
    })),
  }),
);

vi.mock("next/headers", () => ({
  draftMode: vi.fn(async () => ({ disable: mockDisable })),
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("next-sanity/draft-mode", () => ({
  defineEnableDraftMode: mockDefineEnableDraftMode,
}));

vi.mock("@redshirt-sports/sanity/client", () => ({
  client: {
    withConfig: vi.fn(() => ({})),
  },
}));

vi.mock("@redshirt-sports/sanity/token", () => ({
  token: "test-token",
}));

describe("draft-mode routes", () => {
  it("disable route turns off draft mode and redirects home", async () => {
    const { GET } = await import("@/app/api/draft-mode/disable/route");
    await expect(GET()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(mockDisable).toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("enable route is created via defineEnableDraftMode", async () => {
    const enable = await import("@/app/api/draft-mode/enable/route");
    expect(mockDefineEnableDraftMode).toHaveBeenCalled();
    expect(enable.GET).toBeDefined();
    await expect(enable.GET(new Request("https://example.com"))).resolves.toBeInstanceOf(
      Response,
    );
  });
});
