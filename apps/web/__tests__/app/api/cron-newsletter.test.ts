const { mockConfig, mockSend } = vi.hoisted(() => ({
  mockConfig: vi.fn(),
  mockSend: vi.fn(),
}));

vi.mock("@/lib/newsletter/config", () => ({ newsletterConfig: mockConfig }));
vi.mock("@/lib/newsletter/weekly-digest", () => ({
  sendWeeklyDigest: mockSend,
}));

import { GET } from "@/app/api/cron/newsletter/route";

const SECRET = "cron-secret-at-least-16";

function run(auth?: string) {
  return GET(
    new Request("https://site.test/api/cron/newsletter", {
      headers: auth ? { authorization: auth } : {},
    }),
  );
}

describe("GET /api/cron/newsletter", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", SECRET);
    mockConfig.mockReturnValue({ segmentId: "seg_123" });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("sends the issue and reports what happened", async () => {
    mockSend.mockResolvedValue({
      status: "sent",
      broadcastId: "bc_1",
      articles: 3,
    });
    const response = await run(`Bearer ${SECRET}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "sent",
      broadcastId: "bc_1",
      articles: 3,
    });
    expect(mockSend).toHaveBeenCalledWith(
      { segmentId: "seg_123" },
      expect.any(Date),
    );
  });

  it("answers 500 when the send failed, so Vercel shows it", async () => {
    mockSend.mockResolvedValue({ status: "failed", error: "boom" });
    expect((await run(`Bearer ${SECRET}`)).status).toBe(500);
  });

  it("rejects a missing or wrong secret", async () => {
    expect((await run()).status).toBe(401);
    expect((await run("Bearer nope")).status).toBe(401);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("refuses to run without CRON_SECRET", async () => {
    vi.stubEnv("CRON_SECRET", "");
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await run(`Bearer ${SECRET}`)).status).toBe(500);
  });

  it("refuses to run without the newsletter env", async () => {
    mockConfig.mockReturnValue(null);
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await run(`Bearer ${SECRET}`)).status).toBe(500);
    expect(mockSend).not.toHaveBeenCalled();
  });
});
