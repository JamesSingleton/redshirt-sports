const {
  mockConfig,
  mockListPolls,
  mockCreate,
  mockUpdate,
  mockAdd,
  mockTopicsUpdate,
  mockTopicsList,
  mockTopicsCreate,
  mockCapture,
} = vi.hoisted(() => ({
  mockConfig: vi.fn(),
  mockListPolls: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockAdd: vi.fn(),
  mockTopicsUpdate: vi.fn(),
  mockTopicsList: vi.fn(),
  mockTopicsCreate: vi.fn(),
  mockCapture: vi.fn(),
}));

vi.mock("@/lib/newsletter/config", () => ({ newsletterConfig: mockConfig }));
vi.mock("@redshirt-sports/db/queries", () => ({ listPolls: mockListPolls }));
vi.mock("@sentry/nextjs", () => ({ captureMessage: mockCapture }));

import { GET } from "@/app/api/newsletter/confirm/route";
import { signConfirmToken } from "@/lib/newsletter/token";

const SECRET = "s".repeat(64);
const OK = { data: { id: "x" }, error: null };
const FAIL = (message: string) => ({ data: null, error: { message } });
const POLLS = [
  { id: "poll-fcs", name: "FCS Top 25", sport: { name: "Football" } },
  { id: "poll-fbs", name: "FBS Top 25", sport: { name: "Football" } },
];

async function confirm(token?: string) {
  const url = new URL("https://site.test/api/newsletter/confirm");
  if (token !== undefined) url.searchParams.set("token", token);
  const response = await GET(new Request(url));
  return {
    status: response.status,
    location: response.headers.get("location"),
  };
}

const token = (digest = true, pollIds = ["poll-fcs"]) =>
  signConfirmToken({ email: "fan@example.test", digest, pollIds }, SECRET);

const at = (status: string) => `https://site.test/newsletter?status=${status}`;

describe("GET /api/newsletter/confirm", () => {
  beforeEach(() => {
    mockConfig.mockReturnValue({
      resend: {
        contacts: {
          create: mockCreate,
          update: mockUpdate,
          segments: { add: mockAdd },
          topics: { update: mockTopicsUpdate },
        },
        topics: { list: mockTopicsList, create: mockTopicsCreate },
      },
      segmentId: "seg_123",
      signingSecret: SECRET,
    });
    mockListPolls.mockResolvedValue(POLLS);
    mockTopicsList.mockResolvedValue({
      data: {
        data: [{ id: "top_digest", name: "The Week in College Sports" }],
      },
      error: null,
    });
    mockTopicsCreate.mockResolvedValue({
      data: { id: "top_fcs" },
      error: null,
    });
    for (const mock of [mockCreate, mockUpdate, mockAdd, mockTopicsUpdate]) {
      mock.mockResolvedValue(OK);
    }
  });
  afterEach(() => vi.clearAllMocks());

  it("adds a new reader with the topics they ticked", async () => {
    expect(await confirm(token())).toEqual({
      status: 303,
      location: at("confirmed"),
    });
    // FCS had no topic yet: its first subscriber creates it, opt-in only.
    expect(mockTopicsCreate).toHaveBeenCalledWith({
      name: "Football: FCS Top 25",
      description: "The Football: FCS Top 25 the moment it's published.",
      defaultSubscription: "opt_out",
    });
    expect(mockCreate).toHaveBeenCalledWith({
      email: "fan@example.test",
      unsubscribed: false,
      segments: [{ id: "seg_123" }],
      topics: [
        { id: "top_digest", subscription: "opt_in" },
        { id: "top_fcs", subscription: "opt_in" },
      ],
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("opts a new poll-only reader out of the weekly issue", async () => {
    await confirm(token(false));
    expect(mockCreate.mock.lastCall?.[0].topics).toEqual([
      { id: "top_digest", subscription: "opt_out" },
      { id: "top_fcs", subscription: "opt_in" },
    ]);
  });

  it("adds new picks for a returning reader without dropping old ones", async () => {
    mockCreate.mockResolvedValue(FAIL("Contact already exists"));
    expect((await confirm(token(false))).location).toBe(at("confirmed"));
    expect(mockUpdate).toHaveBeenCalledWith({
      email: "fan@example.test",
      unsubscribed: false,
    });
    expect(mockAdd).toHaveBeenCalledWith({
      email: "fan@example.test",
      segmentId: "seg_123",
    });
    expect(mockTopicsUpdate).toHaveBeenCalledWith({
      email: "fan@example.test",
      topics: [{ id: "top_fcs", subscription: "opt_in" }],
    });
  });

  it("opts a returning reader back in to the weekly issue", async () => {
    mockCreate.mockResolvedValue(FAIL("exists"));
    await confirm(token(true, []));
    expect(mockTopicsUpdate).toHaveBeenCalledWith({
      email: "fan@example.test",
      topics: [{ id: "top_digest", subscription: "opt_in" }],
    });
  });

  it("has nothing to opt in to when a picked poll was retired", async () => {
    mockCreate.mockResolvedValue(FAIL("exists"));
    expect((await confirm(token(false, ["poll-gone"]))).location).toBe(
      at("confirmed"),
    );
    expect(mockTopicsUpdate).not.toHaveBeenCalled();
  });

  it.each([
    ["update", () => mockUpdate.mockResolvedValue(FAIL("no update"))],
    ["segment add", () => mockAdd.mockResolvedValue(FAIL("no segment"))],
    ["topics", () => mockTopicsUpdate.mockResolvedValue(FAIL("no topics"))],
  ])("reports a failed %s", async (_step, arrange) => {
    mockCreate.mockResolvedValue(FAIL("exists"));
    arrange();
    expect((await confirm(token())).location).toBe(at("error"));
    expect(mockCapture).toHaveBeenCalledOnce();
  });

  it("reports Resend refusing to list topics", async () => {
    mockTopicsList.mockResolvedValue(FAIL("forbidden"));
    expect((await confirm(token())).location).toBe(at("error"));
    expect(mockCapture).toHaveBeenCalledWith(
      "Newsletter confirm failed: Resend topics: forbidden",
      "error",
    );
  });

  it("reports anything else that throws", async () => {
    mockListPolls.mockRejectedValue("db down");
    expect((await confirm(token())).location).toBe(at("error"));
    expect(mockCapture).toHaveBeenCalledWith(
      "Newsletter confirm failed: db down",
      "error",
    );
  });

  it.each([undefined, "", "forged.token"])(
    "sends a bad token %j to the expired message",
    async (bad) => {
      expect((await confirm(bad)).location).toBe(at("invalid"));
      expect(mockCreate).not.toHaveBeenCalled();
    },
  );

  it("errors while the newsletter isn't configured", async () => {
    mockConfig.mockReturnValue(null);
    expect((await confirm(token())).location).toBe(at("error"));
  });
});
