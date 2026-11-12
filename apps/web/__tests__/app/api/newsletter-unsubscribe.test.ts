import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";

const { mockContactsUpdate, mockIsNewsletterEnabled } = vi.hoisted(() => ({
  mockContactsUpdate: vi.fn(),
  mockIsNewsletterEnabled: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn(function Resend() {
    return { contacts: { update: mockContactsUpdate } };
  }),
}));

vi.mock("@/lib/newsletter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/newsletter")>();
  return {
    ...actual,
    isNewsletterEnabled: mockIsNewsletterEnabled,
  };
});

import { GET, POST } from "@/app/api/newsletter/unsubscribe/route";

const SECRET = process.env.NEWSLETTER_SIGNING_SECRET!;

function sign(email: string, expires: number) {
  return createHmac("sha256", SECRET)
    .update(`${email}:unsubscribe:${expires}`)
    .digest("hex");
}

function makeRequest(params: Record<string, string>, method = "GET") {
  const url = new URL("http://localhost/api/newsletter/unsubscribe");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url, { method });
}

describe("GET /api/newsletter/unsubscribe", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    vi.clearAllMocks();
    mockIsNewsletterEnabled.mockReturnValue(true);
    mockContactsUpdate.mockResolvedValue({ data: {}, error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 503 when newsletter is disabled", async () => {
    mockIsNewsletterEnabled.mockReturnValue(false);
    const res = await GET(makeRequest({}));
    expect(res.status).toBe(503);
    const html = await res.text();
    expect(html).toContain("isn't available yet");
  });

  it("shows confirmation form with valid signature (does not mutate)", async () => {
    const email = "test@example.com";
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const sig = sign(email, expires);

    const res = await GET(
      makeRequest({ email, expires: String(expires), sig }),
    );

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("<form");
    expect(html).toContain("Unsubscribe");
    expect(html).toContain('method="POST"');
    expect(mockContactsUpdate).not.toHaveBeenCalled();
  });

  it("rejects expired link", async () => {
    const email = "test@example.com";
    const expires = Math.floor(Date.now() / 1000) - 1;
    const sig = sign(email, expires);

    const res = await GET(
      makeRequest({ email, expires: String(expires), sig }),
    );

    expect(res.status).toBe(400);
    const html = await res.text();
    expect(html).toContain("expired");
    expect(mockContactsUpdate).not.toHaveBeenCalled();
  });

  it("rejects tampered signature", async () => {
    const email = "test@example.com";
    const expires = Math.floor(Date.now() / 1000) + 3600;

    const res = await GET(
      makeRequest({ email, expires: String(expires), sig: "bad" }),
    );

    expect(res.status).toBe(400);
    expect(mockContactsUpdate).not.toHaveBeenCalled();
  });

  it("rejects missing parameters", async () => {
    const res = await GET(makeRequest({}));

    expect(res.status).toBe(400);
    expect(mockContactsUpdate).not.toHaveBeenCalled();
  });
});

describe("POST /api/newsletter/unsubscribe", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    vi.clearAllMocks();
    mockIsNewsletterEnabled.mockReturnValue(true);
    mockContactsUpdate.mockResolvedValue({ data: {}, error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 503 when newsletter is disabled", async () => {
    mockIsNewsletterEnabled.mockReturnValue(false);
    const res = await POST(makeRequest({}, "POST"));
    expect(res.status).toBe(503);
  });

  it("unsubscribes via POST with valid signature", async () => {
    const email = "test@example.com";
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const sig = sign(email, expires);

    const res = await POST(
      makeRequest({ email, expires: String(expires), sig }, "POST"),
    );

    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Unsubscribed");
    expect(mockContactsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        email,
        unsubscribed: true,
      }),
    );
  });

  it("rejects tampered POST request", async () => {
    const email = "test@example.com";
    const expires = Math.floor(Date.now() / 1000) + 3600;

    const res = await POST(
      makeRequest({ email, expires: String(expires), sig: "bad" }, "POST"),
    );

    expect(res.status).toBe(400);
    expect(mockContactsUpdate).not.toHaveBeenCalled();
  });

  it("rejects missing parameters on POST", async () => {
    const res = await POST(makeRequest({}, "POST"));

    expect(res.status).toBe(400);
    expect(mockContactsUpdate).not.toHaveBeenCalled();
  });

  it("returns 500 when Resend returns an error", async () => {
    mockContactsUpdate.mockResolvedValue({
      data: null,
      error: { message: "Resend down" },
    });
    const email = "test@example.com";
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const sig = sign(email, expires);

    const res = await POST(
      makeRequest({ email, expires: String(expires), sig }, "POST"),
    );

    expect(res.status).toBe(500);
    const html = await res.text();
    expect(html).toContain("Something went wrong");
  });

  it("returns 500 when the Resend request throws", async () => {
    mockContactsUpdate.mockRejectedValue(new Error("network"));
    const email = "test@example.com";
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const sig = sign(email, expires);

    const res = await POST(
      makeRequest({ email, expires: String(expires), sig }, "POST"),
    );

    expect(res.status).toBe(500);
    const html = await res.text();
    expect(html).toContain("Something went wrong");
  });

  it("is idempotent — calling twice succeeds both times", async () => {
    const email = "test@example.com";
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const sig = sign(email, expires);
    const url = makeRequest({ email, expires: String(expires), sig }).url;

    const res1 = await POST(new NextRequest(url, { method: "POST" }));
    const res2 = await POST(new NextRequest(url, { method: "POST" }));

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
  });
});
