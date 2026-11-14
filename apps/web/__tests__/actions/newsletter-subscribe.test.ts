const {
  mockContactsCreate,
  mockContactsGet,
  mockEmailsSend,
  mockRatelimit,
  mockDailyRatelimit,
  mockIsNewsletterEnabled,
  requestHeaders,
} = vi.hoisted(() => ({
  requestHeaders: { current: new Headers() },
  mockContactsCreate: vi.fn(),
  mockContactsGet: vi.fn(),
  mockEmailsSend: vi.fn(),
  mockRatelimit: vi.fn(),
  mockDailyRatelimit: vi.fn(),
  mockIsNewsletterEnabled: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(function Resend() {
    return {
      contacts: { create: mockContactsCreate, get: mockContactsGet },
      emails: { send: mockEmailsSend },
    };
  }),
}));

vi.mock("@/server/ratelimit", () => ({
  newsletterRatelimit: { limit: mockRatelimit },
  newsletterDailyRatelimit: { limit: mockDailyRatelimit },
}));

vi.mock("next/headers", () => ({
  headers: async () => requestHeaders.current,
}));

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

vi.mock("@/lib/newsletter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/newsletter")>();
  return {
    ...actual,
    isNewsletterEnabled: mockIsNewsletterEnabled,
  };
});

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
    mockIsNewsletterEnabled.mockReturnValue(true);
    mockContactsGet.mockResolvedValue({
      data: null,
      error: { statusCode: 404, message: "not found", name: "not_found" },
    });
    mockContactsCreate.mockResolvedValue({ data: {}, error: null });
    mockEmailsSend.mockResolvedValue({ data: {}, error: null });
    mockRatelimit.mockResolvedValue({ success: true });
    mockDailyRatelimit.mockResolvedValue({ success: true });
    requestHeaders.current = new Headers({
      "x-forwarded-for": "1.2.3.4, 10.0.0.1",
    });
  });

  it("returns error when newsletter is disabled", async () => {
    mockIsNewsletterEnabled.mockReturnValue(false);
    const result = await newsletterSubscribe(
      makeFormData({ email: "user@example.com" }),
    );
    expect(result).toEqual({
      error: "Newsletter signup isn't available yet.",
    });
    expect(mockContactsGet).not.toHaveBeenCalled();
  });

  it("returns success and creates contact + sends email for new subscriber", async () => {
    const result = await newsletterSubscribe(
      makeFormData({ email: "user@example.com" }),
    );

    expect(result).toEqual({ success: true });
    expect(mockContactsGet).toHaveBeenCalledWith(
      expect.objectContaining({ email: "user@example.com" }),
    );
    expect(mockContactsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@example.com",
        unsubscribed: true,
      }),
    );
    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        html: expect.stringContaining("/api/newsletter/confirm"),
      }),
    );
  });

  it("normalizes email before contact lookup", async () => {
    await newsletterSubscribe(makeFormData({ email: "  User@Example.COM  " }));

    expect(mockContactsGet).toHaveBeenCalledWith(
      expect.objectContaining({ email: "user@example.com" }),
    );
  });

  it("returns success without sending when contact is already subscribed", async () => {
    mockContactsGet.mockResolvedValue({
      data: { id: "c1", email: "user@example.com", unsubscribed: false },
      error: null,
    });

    const result = await newsletterSubscribe(
      makeFormData({ email: "user@example.com" }),
    );

    expect(result).toEqual({ success: true });
    expect(mockContactsCreate).not.toHaveBeenCalled();
    expect(mockEmailsSend).not.toHaveBeenCalled();
  });

  it("re-sends confirmation when contact is pending (unsubscribed === true)", async () => {
    mockContactsGet.mockResolvedValue({
      data: { id: "c1", email: "user@example.com", unsubscribed: true },
      error: null,
    });

    const result = await newsletterSubscribe(
      makeFormData({ email: "user@example.com" }),
    );

    expect(result).toEqual({ success: true });
    expect(mockContactsCreate).not.toHaveBeenCalled();
    expect(mockEmailsSend).toHaveBeenCalled();
  });

  it("returns success and logs when contact create fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockContactsCreate.mockResolvedValue({
      data: null,
      error: { message: "bad request" },
    });

    const result = await newsletterSubscribe(
      makeFormData({ email: "user@example.com" }),
    );

    expect(result).toEqual({ success: true });
    expect(errorSpy).toHaveBeenCalledWith(
      "newsletter: failed to create contact",
    );
    expect(mockEmailsSend).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("returns success and logs when email send fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockEmailsSend.mockResolvedValue({
      data: null,
      error: { message: "send failed" },
    });

    const result = await newsletterSubscribe(
      makeFormData({ email: "user@example.com" }),
    );

    expect(result).toEqual({ success: true });
    expect(errorSpy).toHaveBeenCalledWith(
      "newsletter: failed to send confirmation email",
    );
    errorSpy.mockRestore();
  });

  it("returns success and logs when contact lookup fails with non-404", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockContactsGet.mockResolvedValue({
      data: null,
      error: { statusCode: 500, message: "server error" },
    });

    const result = await newsletterSubscribe(
      makeFormData({ email: "user@example.com" }),
    );

    expect(result).toEqual({ success: true });
    expect(errorSpy).toHaveBeenCalledWith(
      "newsletter: failed to look up contact",
    );
    expect(mockContactsCreate).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("returns error for invalid email", async () => {
    const result = await newsletterSubscribe(
      makeFormData({ email: "not-an-email" }),
    );

    expect(result).toEqual({ error: "Please enter a valid email address." });
    expect(mockContactsGet).not.toHaveBeenCalled();
  });

  it("returns error for missing email", async () => {
    const result = await newsletterSubscribe(makeFormData({}));

    expect(result).toEqual({ error: "Please enter a valid email address." });
    expect(mockContactsGet).not.toHaveBeenCalled();
  });

  it("silently succeeds when honeypot is filled", async () => {
    const result = await newsletterSubscribe(
      makeFormData({ email: "user@example.com", url: "http://spam.com" }),
    );

    expect(result).toEqual({ success: true });
    expect(mockContactsGet).not.toHaveBeenCalled();
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
    expect(mockContactsGet).not.toHaveBeenCalled();
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

  it("confirmation email has no unsubscribe link or headers (Resend handles unsubscribes for Broadcasts)", async () => {
    await newsletterSubscribe(makeFormData({ email: "user@example.com" }));

    const sent = mockEmailsSend.mock.calls[0]?.[0];
    expect(sent.headers).toBeUndefined();
    expect(sent.html).not.toContain("unsubscribe");
  });

  it("skips email but keeps contact when daily send limit is reached", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockDailyRatelimit.mockResolvedValue({ success: false });

    const result = await newsletterSubscribe(
      makeFormData({ email: "user@example.com" }),
    );

    expect(result).toEqual({ success: true });
    expect(mockContactsCreate).toHaveBeenCalled();
    expect(mockEmailsSend).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "newsletter: daily confirmation email limit reached",
    );
    errorSpy.mockRestore();
  });
});
