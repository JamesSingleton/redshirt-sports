const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));

vi.mock("@redshirt-sports/sanity/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@redshirt-sports/sanity/client")>()),
  client: { fetch: mockFetch },
}));

import { emailLogos, toEmailLogo } from "@/lib/newsletter/email-logos";

const svg = (id: string) => ({
  asset: { _ref: `image-${id}-2931x485-svg` },
  width: 2931,
  height: 485,
});

describe("emailLogos", () => {
  afterEach(() => vi.clearAllMocks());

  it("serves each wordmark as a PNG at its own aspect ratio", async () => {
    mockFetch.mockResolvedValue({
      footerLogo: svg("light"),
      footerLogoDarkMode: svg("dark"),
    });
    const { onLight, onDark } = await emailLogos();
    expect(onLight).toEqual({
      src: expect.stringMatching(/\/light-2931x485\.svg\?.*fm=png/),
      width: 169,
      height: 28,
    });
    expect(onLight?.src).toContain("h=56");
    expect(onDark?.src).toMatch(/\/dark-2931x485\.svg\?/);
  });

  it("is empty when settings has no logos", async () => {
    mockFetch.mockResolvedValue(null);
    expect(await emailLogos()).toEqual({ onLight: null, onDark: null });
  });

  it("doesn't hold an email back when Sanity is down", async () => {
    mockFetch.mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await emailLogos()).toEqual({ onLight: null, onDark: null });
  });

  it("skips an image without an asset or dimensions", () => {
    expect(toEmailLogo({ width: 10, height: 10 })).toBeNull();
    expect(toEmailLogo({ ...svg("x"), height: null })).toBeNull();
  });
});
