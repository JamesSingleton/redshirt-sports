import { describe, expect, it } from "vitest";

import {
  assertPublicHttpUrl,
  resolveLinkCheckTarget,
} from "@/lib/link-check-url";

describe("resolveLinkCheckTarget", () => {
  const requestUrl = new URL("https://www.redshirtsports.xyz/api/link-check");

  it("resolves relative paths against the site origin", () => {
    expect(resolveLinkCheckTarget("/about", requestUrl)?.toString()).toBe(
      "https://www.redshirtsports.xyz/about",
    );
  });

  it("accepts public https URLs", () => {
    expect(
      resolveLinkCheckTarget("https://example.com/article", requestUrl)?.href,
    ).toBe("https://example.com/article");
  });

  it("rejects http URLs", () => {
    expect(
      resolveLinkCheckTarget("http://example.com/article", requestUrl),
    ).toBeNull();
  });

  it("rejects unsupported protocols", () => {
    expect(resolveLinkCheckTarget("ftp://example.com", requestUrl)).toBeNull();
  });
});

describe("assertPublicHttpUrl", () => {
  it("rejects localhost targets", async () => {
    await expect(
      assertPublicHttpUrl(new URL("http://localhost:3000/admin")),
    ).rejects.toThrow("Invalid URL");
  });

  it("rejects private IPv4 targets", async () => {
    await expect(
      assertPublicHttpUrl(new URL("http://10.0.0.1/internal")),
    ).rejects.toThrow("Invalid URL");

    await expect(
      assertPublicHttpUrl(new URL("http://169.254.169.254/latest/meta-data/")),
    ).rejects.toThrow("Invalid URL");
  });

  it("rejects http URLs", async () => {
    await expect(
      assertPublicHttpUrl(new URL("http://example.com/article")),
    ).rejects.toThrow("Invalid URL");
  });

  it("rejects URLs with embedded credentials", async () => {
    await expect(
      assertPublicHttpUrl(new URL("https://user:pass@example.com")),
    ).rejects.toThrow("Invalid URL");
  });
});
