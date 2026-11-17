const {
  mockPublic,
  mockBotId,
  mockLimit,
  mockCreate,
  mockCapture,
  mockHeaders,
} = vi.hoisted(() => ({
  mockPublic: vi.fn(),
  mockBotId: vi.fn(),
  mockLimit: vi.fn(),
  mockCreate: vi.fn(),
  mockCapture: vi.fn(),
  mockHeaders: vi.fn(),
}));

vi.mock("@/lib/portal-data", () => ({ portalIsPublic: mockPublic }));
vi.mock("botid/server", () => ({ checkBotId: mockBotId }));
vi.mock("@/server/ratelimit", () => ({
  portalSubmissionRatelimit: { limit: mockLimit },
}));
vi.mock("@redshirt-sports/db/queries", () => ({
  createPlayerSubmission: mockCreate,
}));
vi.mock("@sentry/nextjs", () => ({ captureException: mockCapture }));
vi.mock("next/headers", () => ({ headers: mockHeaders }));

import { submitPortalMove } from "@/actions/submit-portal-move";
import { SUBMIT_FIELDS } from "@/lib/portal-submit";

const valid = {
  submitterRole: "coach",
  submitterName: "Test Coach",
  submitterEmail: "Coach@Example.test",
  playerFirstName: "Test",
  playerLastName: "Player",
  sportSlug: "football",
  currentSchool: "Montana",
  move: "committed",
  destinationSchool: "Boise State",
};

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const idle = { status: "idle" as const };
const submit = (values: Record<string, string> = valid) =>
  submitPortalMove(idle, form(values));

describe("submitPortalMove", () => {
  beforeEach(() => {
    mockPublic.mockReturnValue(true);
    mockBotId.mockResolvedValue({ isBot: false });
    mockLimit.mockResolvedValue({ success: true });
    mockCreate.mockResolvedValue({ id: 1 });
    mockHeaders.mockResolvedValue(
      new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }),
    );
  });
  afterEach(() => vi.clearAllMocks());

  it("stores a valid submission in the inbox, normalized", async () => {
    expect(await submit()).toEqual({
      status: "sent",
      message:
        "Thanks. An editor will review this before anything appears on the site.",
    });
    expect(mockCreate).toHaveBeenCalledWith({
      submitterRole: "coach",
      submitterName: "Test Coach",
      submitterEmail: "coach@example.test",
      payload: {
        v: 1,
        playerFirstName: "Test",
        playerLastName: "Player",
        sportSlug: "football",
        currentSchool: "Montana",
        move: "committed",
        destinationSchool: "Boise State",
      },
    });
    // Limited by IP (the first hop) and by email.
    expect(mockLimit).toHaveBeenCalledWith("ip:203.0.113.7");
    expect(mockLimit).toHaveBeenCalledWith("email:coach@example.test");
  });

  it("gives a filled honeypot a fake thank-you and stores nothing", async () => {
    expect((await submit({ ...valid, website: "spam.example" })).status).toBe(
      "sent",
    );
    expect(mockBotId).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("turns away what BotID flags as a bot", async () => {
    mockBotId.mockResolvedValueOnce({ isBot: true });
    const result = await submit();
    expect(result).toMatchObject({
      status: "error",
      message: expect.stringContaining("couldn't verify"),
      values: { playerLastName: "Player" },
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns a message per field and keeps what they typed", async () => {
    const result = await submit({
      ...valid,
      submitterEmail: "nope",
      destinationSchool: "",
      link: "http://insecure.example",
    });
    expect(result).toMatchObject({
      status: "error",
      message: "Please fix the highlighted fields.",
      errors: {
        submitterEmail: "Enter a valid email address.",
        destinationSchool: "Which school did they commit to?",
        link: "The link must start with https://",
      },
      values: { submitterEmail: "nope", playerFirstName: "Test" },
    });
    // Only the first message for a field.
    const empty = await submit({});
    expect(empty.errors?.playerFirstName).toBe(
      "The player's first name is required.",
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("caps how much of each field it echoes back", async () => {
    // An invalid submission echoes what was typed, trimmed to 1,000 characters.
    const result = await submit({
      ...valid,
      submitterEmail: "",
      note: "x".repeat(5000),
    });
    expect(result.values?.note).toHaveLength(1000);
    // Every field the form has is echoed.
    expect(Object.keys(result.values ?? {})).toEqual([...SUBMIT_FIELDS]);
  });

  it("rate limits by IP and by email", async () => {
    mockLimit.mockResolvedValueOnce({ success: false });
    expect(await submit()).toMatchObject({
      status: "error",
      message: expect.stringContaining("try again in an hour"),
    });
    mockLimit
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false });
    expect((await submit()).status).toBe("error");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("fails open when the limiter is down, and copes without an IP", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockLimit.mockRejectedValue(new Error("redis down"));
    mockHeaders.mockResolvedValueOnce(new Headers());
    expect((await submit()).status).toBe("sent");
    expect(mockLimit).toHaveBeenCalledWith("ip:unknown");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("reports a database failure without losing the form", async () => {
    mockCreate.mockRejectedValueOnce(new Error("db down"));
    expect(await submit()).toMatchObject({
      status: "error",
      message: "Something went wrong on our end. Please try again.",
      values: { playerLastName: "Player" },
    });
    expect(mockCapture).toHaveBeenCalled();
  });

  it("is closed while the portal is hidden", async () => {
    mockPublic.mockReturnValue(false);
    expect(await submit()).toEqual({
      status: "error",
      message: "Submissions aren't open yet.",
    });
    expect(mockBotId).not.toHaveBeenCalled();
  });

  it("ignores non-text form values", async () => {
    const data = form(valid);
    data.set("note", new Blob(["file"]));
    expect((await submitPortalMove(idle, data)).status).toBe("sent");
    expect(mockCreate.mock.calls[0]![0].payload.note).toBeUndefined();
  });
});
