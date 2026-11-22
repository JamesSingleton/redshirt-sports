const { mockConfig, mockSend } = vi.hoisted(() => ({
  mockConfig: vi.fn(),
  mockSend: vi.fn(),
}));

vi.mock("@/lib/newsletter/config", () => ({ newsletterConfig: mockConfig }));
vi.mock("@/lib/newsletter/poll-alerts", () => ({ sendPollAlerts: mockSend }));

import { GET } from "@/app/api/cron/poll-alerts/route";

const SECRET = "cron-secret-at-least-16";

function run(auth?: string) {
  return GET(
    new Request("https://site.test/api/cron/poll-alerts", {
      headers: auth ? { authorization: auth } : {},
    }),
  );
}

describe("GET /api/cron/poll-alerts", () => {
  beforeEach(() => {
    vi.stubEnv("CRON_SECRET", SECRET);
    mockConfig.mockReturnValue({ segmentId: "seg_123" });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("sends what's new and reports it", async () => {
    const results = [
      { status: "sent", broadcastId: "bc_1", poll: "FCS Top 25", week: 11 },
    ];
    mockSend.mockResolvedValue(results);
    const response = await run(`Bearer ${SECRET}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ results });
  });

  it("answers 500 when an alert failed", async () => {
    mockSend.mockResolvedValue([{ status: "failed", error: "boom" }]);
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
