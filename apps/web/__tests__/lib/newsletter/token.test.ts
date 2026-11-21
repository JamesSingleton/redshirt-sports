import {
  CONFIRM_TOKEN_TTL_MS,
  signConfirmToken,
  verifyConfirmToken,
} from "@/lib/newsletter/token";

const SECRET = "a".repeat(64);
const fan = (email = "fan@example.test") => ({
  email,
  digest: true,
  pollIds: ["poll-fcs"],
});
const NOW = Date.UTC(2026, 10, 20);

describe("newsletter confirm tokens", () => {
  it("round-trips the email it was made for", () => {
    const token = signConfirmToken(fan(), SECRET, NOW);
    expect(verifyConfirmToken(token, SECRET, NOW + 1000)).toEqual(fan());
  });

  it("still works on the last day and not after", () => {
    const token = signConfirmToken(fan(), SECRET, NOW);
    expect(
      verifyConfirmToken(token, SECRET, NOW + CONFIRM_TOKEN_TTL_MS),
    ).toEqual(fan());
    expect(
      verifyConfirmToken(token, SECRET, NOW + CONFIRM_TOKEN_TTL_MS + 1),
    ).toBeNull();
  });

  it("rejects a token signed with another secret", () => {
    const token = signConfirmToken(fan(), "b".repeat(64), NOW);
    expect(verifyConfirmToken(token, SECRET, NOW)).toBeNull();
  });

  it("rejects a payload swapped for another address", () => {
    const [, signature] = signConfirmToken(fan(), SECRET, NOW).split(".");
    const forged = Buffer.from(
      JSON.stringify({ e: "victim@example.test", t: NOW, d: true, p: [] }),
    ).toString("base64url");
    expect(
      verifyConfirmToken(`${forged}.${signature}`, SECRET, NOW),
    ).toBeNull();
  });

  it.each(["", "nodot", ".sig", "payload.", "a.b.c"])(
    "rejects malformed token %j",
    (token) => {
      expect(verifyConfirmToken(token, SECRET, NOW)).toBeNull();
    },
  );
});
