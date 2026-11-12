import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/get-base-url", () => ({
  getBaseUrl: () => "https://redshirtsports.com",
}));

import { createSignedUrl, verifySignature } from "@/lib/newsletter";

const SECRET = process.env.NEWSLETTER_SIGNING_SECRET!;

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

describe("createSignedUrl", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a confirm URL with email, expires, and sig params", () => {
    const url = createSignedUrl("test@example.com", "confirm");
    const parsed = new URL(url);

    expect(parsed.origin).toBe("https://redshirtsports.com");
    expect(parsed.pathname).toBe("/api/newsletter/confirm");
    expect(parsed.searchParams.get("email")).toBe("test@example.com");
    expect(parsed.searchParams.get("expires")).toBeTruthy();
    expect(parsed.searchParams.get("sig")).toBeTruthy();
  });

  it("returns an unsubscribe URL with the correct path", () => {
    const url = createSignedUrl("test@example.com", "unsubscribe");
    const parsed = new URL(url);

    expect(parsed.pathname).toBe("/api/newsletter/unsubscribe");
  });

  it("confirm URL expires in 24 hours", () => {
    const url = createSignedUrl("test@example.com", "confirm");
    const parsed = new URL(url);
    const expires = Number(parsed.searchParams.get("expires"));
    const nowSeconds = Math.floor(Date.now() / 1000);

    expect(expires - nowSeconds).toBe(60 * 60 * 24);
  });

  it("unsubscribe URL expires in 1 year", () => {
    const url = createSignedUrl("test@example.com", "unsubscribe");
    const parsed = new URL(url);
    const expires = Number(parsed.searchParams.get("expires"));
    const nowSeconds = Math.floor(Date.now() / 1000);

    expect(expires - nowSeconds).toBe(60 * 60 * 24 * 365);
  });
});

describe("verifySignature", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a valid signature", () => {
    const email = "test@example.com";
    const expires = String(Math.floor(Date.now() / 1000) + 3600);
    const payload = `${email}:confirm:${expires}`;
    const sig = sign(payload);

    expect(verifySignature(email, "confirm", expires, sig)).toEqual({
      valid: true,
    });
  });

  it("rejects an expired token", () => {
    const email = "test@example.com";
    const expires = String(Math.floor(Date.now() / 1000) - 1);
    const payload = `${email}:confirm:${expires}`;
    const sig = sign(payload);

    expect(verifySignature(email, "confirm", expires, sig)).toEqual({
      valid: false,
      reason: "expired",
    });
  });

  it("rejects a tampered signature", () => {
    const email = "test@example.com";
    const expires = String(Math.floor(Date.now() / 1000) + 3600);

    expect(verifySignature(email, "confirm", expires, "tampered")).toEqual({
      valid: false,
      reason: "invalid",
    });
  });

  it("rejects a signature for a different email", () => {
    const expires = String(Math.floor(Date.now() / 1000) + 3600);
    const payload = `other@example.com:confirm:${expires}`;
    const sig = sign(payload);

    expect(
      verifySignature("test@example.com", "confirm", expires, sig),
    ).toEqual({
      valid: false,
      reason: "invalid",
    });
  });

  it("rejects a signature for a different purpose", () => {
    const email = "test@example.com";
    const expires = String(Math.floor(Date.now() / 1000) + 3600);
    const payload = `${email}:unsubscribe:${expires}`;
    const sig = sign(payload);

    expect(verifySignature(email, "confirm", expires, sig)).toEqual({
      valid: false,
      reason: "invalid",
    });
  });

  it("rejects non-numeric expires", () => {
    expect(
      verifySignature("test@example.com", "confirm", "abc", "sig"),
    ).toEqual({
      valid: false,
      reason: "invalid",
    });
  });
});
