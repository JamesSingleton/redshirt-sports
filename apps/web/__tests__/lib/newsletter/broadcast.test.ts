import { createElement } from "react";

const { mockSet, mockDel, mockCapture } = vi.hoisted(() => ({
  mockSet: vi.fn(),
  mockDel: vi.fn(),
  mockCapture: vi.fn(),
}));
vi.mock("@/utils/redis", () => ({ default: { set: mockSet, del: mockDel } }));
vi.mock("@sentry/nextjs", () => ({ captureMessage: mockCapture }));

import { broadcastOnce } from "@/lib/newsletter/broadcast";
import type { NewsletterConfig } from "@/lib/newsletter/config";
import { DIGEST_TOPIC } from "@/lib/newsletter/topics";

const content = {
  name: "Issue",
  subject: "Subject",
  previewText: "Preview",
  react: createElement("p", null, "hi"),
};

function setup(created: unknown = { data: { id: "bc_1" }, error: null }) {
  const create = vi.fn().mockResolvedValue(created);
  const config = {
    resend: {
      broadcasts: { create },
      topics: {
        list: vi.fn().mockResolvedValue({
          data: { data: [{ id: "top_digest", name: DIGEST_TOPIC.name }] },
          error: null,
        }),
      },
    },
    segmentId: "seg_123",
    from: "Redshirt Sports <news@example.test>",
  } as unknown as NewsletterConfig;
  const send = (build = async () => content) =>
    broadcastOnce(config, {
      key: "newsletter:test",
      ttlSeconds: 60,
      topic: DIGEST_TOPIC,
      content: build,
    });
  return { create, send };
}

describe("broadcastOnce", () => {
  beforeEach(() => {
    mockSet.mockResolvedValue("OK");
    mockDel.mockResolvedValue(1);
  });
  afterEach(() => vi.clearAllMocks());

  it("sends once to the topic's readers in the segment", async () => {
    const { create, send } = setup();
    expect(await send()).toEqual({ status: "sent", broadcastId: "bc_1" });
    expect(mockSet).toHaveBeenCalledWith(
      "newsletter:test",
      expect.any(String),
      {
        nx: true,
        ex: 60,
      },
    );
    expect(create).toHaveBeenCalledWith({
      ...content,
      from: "Redshirt Sports <news@example.test>",
      segmentId: "seg_123",
      topicId: "top_digest",
      send: true,
    });
  });

  it("skips a key another run already claimed", async () => {
    mockSet.mockResolvedValue(null);
    const { create, send } = setup();
    expect(await send()).toEqual({ status: "skipped", reason: "already-sent" });
    expect(create).not.toHaveBeenCalled();
  });

  it("frees the key for a retry when Resend refuses", async () => {
    const { send } = setup({ data: null, error: { message: "rate limited" } });
    expect(await send()).toEqual({ status: "failed", error: "rate limited" });
    expect(mockDel).toHaveBeenCalledWith("newsletter:test");
    expect(mockCapture).toHaveBeenCalledWith(
      "Broadcast newsletter:test failed: rate limited",
      "error",
    );
  });

  it("treats a reply with no broadcast as a failure", async () => {
    const { send } = setup({ data: null, error: null });
    expect(await send()).toMatchObject({
      status: "failed",
      error: "Resend returned no broadcast",
    });
  });

  it.each([new Error("db down"), "db down"])(
    "frees the key when building the email throws %j",
    async (thrown) => {
      const { send } = setup();
      expect(
        await send(async () => {
          throw thrown;
        }),
      ).toEqual({ status: "failed", error: "db down" });
      expect(mockDel).toHaveBeenCalled();
    },
  );
});
