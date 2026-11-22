import type { ReactElement } from "react";
import { render } from "react-email";

const { mockConfig, mockBotId, mockLimit, mockSend, mockCapture } = vi.hoisted(
  () => ({
    mockConfig: vi.fn(),
    mockBotId: vi.fn(),
    mockLimit: vi.fn(),
    mockSend: vi.fn(),
    mockCapture: vi.fn(),
  }),
);

vi.mock("@/lib/newsletter/config", () => ({ newsletterConfig: mockConfig }));
vi.mock("botid/server", () => ({ checkBotId: mockBotId }));
vi.mock("@/server/ratelimit", () => ({
  newsletterSignupRatelimit: { limit: mockLimit },
}));
vi.mock("@sentry/nextjs", () => ({ captureMessage: mockCapture }));
vi.mock("@redshirt-sports/db/queries", () => ({
  listPolls: async () => [
    { id: "poll-fcs", name: "FCS Top 25", sport: { name: "Football" } },
  ],
}));
vi.mock("@/lib/newsletter/email-logos", () => ({
  emailLogos: async () => ({ onLight: null, onDark: null }),
}));

import { POST } from "@/app/api/newsletter/subscribe/route";
import { verifyConfirmToken } from "@/lib/newsletter/token";

const SECRET = "s".repeat(64);

function post(fields: Record<string, string> | null, ip?: string) {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields ?? {})) body.set(key, value);
  return POST(
    new Request("http://localhost/api/newsletter/subscribe", {
      method: "POST",
      body: fields ? body : "not a form",
      headers: {
        ...(ip ? { "x-forwarded-for": ip } : {}),
        ...(fields ? {} : { "content-type": "text/plain" }),
      },
    }),
  );
}

async function reply(response: Response) {
  return { status: response.status, body: await response.json() };
}

describe("POST /api/newsletter/subscribe", () => {
  beforeEach(() => {
    mockConfig.mockReturnValue({
      resend: { emails: { send: mockSend } },
      segmentId: "seg_123",
      from: "Redshirt Sports <news@example.test>",
      signingSecret: SECRET,
    });
    mockBotId.mockResolvedValue({ isBot: false });
    mockLimit.mockResolvedValue({ success: true });
    mockSend.mockResolvedValue({ data: { id: "em_1" }, error: null });
  });
  afterEach(() => vi.clearAllMocks());

  it("emails a confirm link for the normalized address", async () => {
    expect(
      await reply(
        await post({ email: "Fan@Example.test" }, "203.0.113.7, 10.0.0.1"),
      ),
    ).toEqual({
      status: 200,
      body: {
        status: "sent",
        message: "Check your inbox for a link to confirm your subscription.",
      },
    });
    expect(mockLimit).toHaveBeenCalledWith("ip:203.0.113.7");
    expect(mockLimit).toHaveBeenCalledWith("email:fan@example.test");

    const options = mockSend.mock.lastCall?.[0];
    expect(options).toMatchObject({
      from: "Redshirt Sports <news@example.test>",
      to: "fan@example.test",
      subject: "Confirm your Redshirt Sports newsletter subscription",
    });
    const html = await render(options.react as ReactElement);
    const href = html.match(
      /href="([^"]*\/api\/newsletter\/confirm[^"]*)"/,
    )?.[1];
    const token = new URL(href!.replaceAll("&amp;", "&")).searchParams.get(
      "token",
    );
    expect(verifyConfirmToken(token!, SECRET)).toEqual({
      email: "fan@example.test",
      digest: true,
      pollIds: [],
    });
    // The footer form means the weekly issue.
    expect(html).toContain("The Week in College Sports, every Sunday morning");
    // No logo in settings: the name in text instead.
    expect(html).toContain("Redshirt Sports");
  });

  it("carries ticked poll alerts through the confirm link", async () => {
    expect(
      (
        await post({
          email: "fan@example.test",
          choices: "1",
          poll: "poll-fcs",
        })
      ).status,
    ).toBe(200);
    const html = await render(
      mockSend.mock.lastCall?.[0].react as ReactElement,
    );
    expect(html).toContain("Football: FCS Top 25 alerts");
    expect(html).not.toContain("every Sunday morning");
  });

  it("asks for at least one email", async () => {
    const response = await reply(
      await post({ email: "fan@example.test", choices: "1" }),
    );
    expect(response).toEqual({
      status: 400,
      body: { status: "error", message: "Pick at least one email to get." },
    });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("flags a bad address before saying signups are closed", async () => {
    mockConfig.mockReturnValue(null);
    expect((await post({ email: "" })).status).toBe(400);
  });

  it("refuses while the newsletter isn't configured", async () => {
    mockConfig.mockReturnValue(null);
    expect((await post({ email: "fan@example.test" })).status).toBe(503);
  });

  it("gives a bot that fills the honeypot a fake thank-you", async () => {
    const response = await reply(
      await post({ email: "fan@example.test", website: "spam.test" }),
    );
    expect(response.body.status).toBe("sent");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects what BotID flags", async () => {
    mockBotId.mockResolvedValue({ isBot: true });
    expect((await post({ email: "fan@example.test" })).status).toBe(403);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it.each<Record<string, string> | null>([{ email: "not-an-email" }, {}, null])(
    "rejects a bad body %j",
    async (fields) => {
      expect((await post(fields)).status).toBe(400);
    },
  );

  it("rate limits by IP or address", async () => {
    mockLimit.mockResolvedValueOnce({ success: false });
    expect((await post({ email: "fan@example.test" })).status).toBe(429);
    expect(mockLimit).toHaveBeenCalledWith("ip:unknown");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("fails open when the rate limiter is down", async () => {
    mockLimit.mockRejectedValue(new Error("redis down"));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect((await post({ email: "fan@example.test" })).status).toBe(200);
  });

  it("reports a Resend failure", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "bad from" } });
    expect((await post({ email: "fan@example.test" })).status).toBe(502);
    expect(mockCapture).toHaveBeenCalledWith(
      "Newsletter confirm email failed: bad from",
      "error",
    );
  });
});
