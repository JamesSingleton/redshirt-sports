const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {} as Record<string, string | undefined>,
}));
vi.mock("@/env", () => ({ env: mockEnv }));

import { formatFrom, newsletterConfig } from "@/lib/newsletter/config";

const FULL = {
  RESEND_API_KEY_NEWSLETTER: "re_test",
  RESEND_NEWSLETTER_AUDIENCE_ID: "seg_123",
  NEWSLETTER_FROM_EMAIL: "newsletter@example.test",
  NEWSLETTER_SIGNING_SECRET: "s".repeat(64),
};

describe("newsletterConfig", () => {
  afterEach(() => {
    for (const key of Object.keys(mockEnv)) delete mockEnv[key];
  });

  it("builds a client when every variable is set", () => {
    Object.assign(mockEnv, FULL);
    const config = newsletterConfig();
    expect(config).toMatchObject({
      segmentId: "seg_123",
      from: "Redshirt Sports <newsletter@example.test>",
      signingSecret: "s".repeat(64),
    });
    expect(config?.resend.broadcasts).toBeDefined();
  });

  it.each(Object.keys(FULL))("is null without %s, and says so", (missing) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    Object.assign(mockEnv, FULL, { [missing]: undefined });
    expect(newsletterConfig()).toBeNull();
    expect(log).toHaveBeenCalledWith(`Newsletter is off; set ${missing}.`);
  });
});

describe("formatFrom", () => {
  it("keeps a sender that already has a name", () => {
    expect(formatFrom("Desk <desk@example.test>")).toBe(
      "Desk <desk@example.test>",
    );
  });
});
