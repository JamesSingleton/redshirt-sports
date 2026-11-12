const { mockContactsCreate, mockEmailsSend, mockRatelimit, requestHeaders } =
  vi.hoisted(() => ({
    requestHeaders: { current: new Headers() },
    mockContactsCreate: vi.fn(),
    mockEmailsSend: vi.fn(),
    mockRatelimit: vi.fn(),
  }));

vi.mock("resend", () => ({
  Resend: vi.fn(function Resend() {
    return {
      contacts: { create: mockContactsCreate },
      emails: { send: mockEmailsSend },
    };
  }),
}));

vi.mock("@/server/ratelimit", () => ({
  newsletterRatelimit: { limit: mockRatelimit },
}));

vi.mock("next/headers", () => ({
  headers: async () => requestHeaders.current,
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

import { newsletterSubscribe } from "@/actions/newsletter-subscribe";

function makeFormData(fields: Record<string, string> = {}) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    fd.set(k, v);
  }
  return fd;
}

describe("newsletterSubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContactsCreate.mockResolvedValue({ data: {}, error: null });
    mockEmailsSend.mockResolvedValue({ data: {}, error: null });
    mockRatelimit.mockResolvedValue({ success: true });
    requestHeaders.current = new Headers({
      "x-forwarded-for": "1.2.3.4, 10.0.0.1",
    });
  });

  it("returns success and creates contact + sends email for valid input", async () => {
    const result = await newsletterSubscribe(
      makeFormData({ email: "user@example.com" }),
    );

    expect(result).toEqual({ success: true });
    expect(mockContactsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@example.com",
        unsubscribed: true,
      }),
    );
    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        headers: expect.objectContaining({
          "List-Unsubscribe": expect.stringContaining(
            "/api/newsletter/unsubscribe",
          ),
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        }),
      }),
    );
  });

  it("returns error for invalid email", async () => {
    const result = await newsletterSubscribe(
      makeFormData({ email: "not-an-email" }),
    );

    expect(result).toEqual({ error: "Please enter a valid email address." });
    expect(mockContactsCreate).not.toHaveBeenCalled();
  });

  it("returns error for missing email", async () => {
    const result = await newsletterSubscribe(makeFormData({}));

    expect(result).toEqual({ error: "Please enter a valid email address." });
    expect(mockContactsCreate).not.toHaveBeenCalled();
  });

  it("silently succeeds when honeypot is filled", async () => {
    const result = await newsletterSubscribe(
      makeFormData({ email: "user@example.com", url: "http://spam.com" }),
    );

    expect(result).toEqual({ success: true });
    expect(mockContactsCreate).not.toHaveBeenCalled();
    expect(mockEmailsSend).not.toHaveBeenCalled();
  });

  it("returns error when rate limited", async () => {
    mockRatelimit.mockResolvedValue({ success: false });

    const result = await newsletterSubscribe(
      makeFormData({ email: "user@example.com" }),
    );

    expect(result).toEqual({
      error: "Too many requests. Please try again later.",
    });
    expect(mockContactsCreate).not.toHaveBeenCalled();
  });

  it("returns success even when Resend throws", async () => {
    mockContactsCreate.mockRejectedValue(new Error("Resend down"));

    const result = await newsletterSubscribe(
      makeFormData({ email: "user@example.com" }),
    );

    expect(result).toEqual({ success: true });
  });

  it("rate limits by the forwarded client IP", async () => {
    await newsletterSubscribe(makeFormData({ email: "user@example.com" }));

    expect(mockRatelimit).toHaveBeenCalledWith("newsletter:1.2.3.4");
  });

  it("falls back to x-real-ip, then a shared bucket", async () => {
    requestHeaders.current = new Headers({ "x-real-ip": "5.6.7.8" });
    await newsletterSubscribe(makeFormData({ email: "user@example.com" }));
    expect(mockRatelimit).toHaveBeenLastCalledWith("newsletter:5.6.7.8");

    requestHeaders.current = new Headers();
    await newsletterSubscribe(makeFormData({ email: "user@example.com" }));
    expect(mockRatelimit).toHaveBeenLastCalledWith("newsletter:anonymous");
  });

  it("confirmation email includes unsubscribe link in body", async () => {
    await newsletterSubscribe(makeFormData({ email: "user@example.com" }));

    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("/api/newsletter/unsubscribe"),
      }),
    );
  });
});
