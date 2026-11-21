import type { ReactElement } from "react";
import { render } from "react-email";

const { mockFetch, mockBroadcast } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockBroadcast: vi.fn(),
}));

vi.mock("@redshirt-sports/sanity/client", () => ({
  client: { withConfig: () => ({ fetch: mockFetch }) },
  urlForJpeg: () => {
    const builder = {
      size: () => builder,
      quality: () => builder,
      url: () => "https://cdn.sanity.test/image.jpg",
    };
    return builder;
  },
}));
vi.mock("@/lib/newsletter/broadcast", () => ({
  broadcastOnce: mockBroadcast,
  RESEND_UNSUBSCRIBE_URL: "{{{RESEND_UNSUBSCRIBE_URL}}}",
}));
vi.mock("@/lib/newsletter/email-logos", () => ({
  emailLogos: async () => ({
    onLight: null,
    onDark: {
      src: "https://cdn.sanity.test/logo-dark.png",
      width: 169,
      height: 28,
    },
  }),
}));

import type { NewsletterConfig } from "@/lib/newsletter/config";
import { DIGEST_TOPIC } from "@/lib/newsletter/topics";
import {
  sendWeeklyDigest,
  toDigestArticle,
} from "@/lib/newsletter/weekly-digest";

const NOW = new Date("2026-11-22T13:00:00.000Z");
const config = { segmentId: "seg_123" } as unknown as NewsletterConfig;

function post(overrides: Record<string, unknown> = {}) {
  return {
    _id: "post-1",
    title: "Montana State wins the Brawl",
    excerpt: "The Bobcats held on.",
    slug: "montana-state-wins",
    publishedAt: "2026-11-21T20:00:00.000Z",
    image: { asset: { _ref: "image-abc-1200x675-jpg" } },
    authors: ["Jane Doe", "John Roe"],
    sport: "Football",
    ...overrides,
  } as never;
}

type BroadcastArgs = {
  key: string;
  ttlSeconds: number;
  topic: unknown;
  content: () => Promise<{
    name: string;
    subject: string;
    previewText: string;
    react: ReactElement;
  }>;
};
const lastBroadcast = () => mockBroadcast.mock.lastCall?.[1] as BroadcastArgs;

describe("toDigestArticle", () => {
  it("links the article and builds a JPEG and byline", () => {
    expect(toDigestArticle(post(), "https://site.test")).toEqual({
      id: "post-1",
      title: "Montana State wins the Brawl",
      excerpt: "The Bobcats held on.",
      url: "https://site.test/montana-state-wins",
      imageUrl: "https://cdn.sanity.test/image.jpg",
      meta: "Football · By Jane Doe and John Roe",
    });
  });

  it("drops what an article doesn't have", () => {
    expect(
      toDigestArticle(
        post({ image: null, authors: [], sport: null }),
        "https://site.test",
      ),
    ).toMatchObject({ imageUrl: null, meta: "" });
  });
});

describe("sendWeeklyDigest", () => {
  beforeEach(() =>
    mockBroadcast.mockResolvedValue({ status: "sent", broadcastId: "bc_1" }),
  );
  afterEach(() => vi.clearAllMocks());

  it("sends nothing in a week without articles", async () => {
    mockFetch.mockResolvedValue([]);
    expect(await sendWeeklyDigest(config, NOW)).toEqual({
      status: "skipped",
      reason: "no-articles",
    });
    expect(mockFetch.mock.lastCall?.[1]).toEqual({
      from: "2026-11-15T13:00:00.000Z",
      to: "2026-11-22T13:00:00.000Z",
    });
    expect(mockBroadcast).not.toHaveBeenCalled();
  });

  it("sends one issue per day to the weekly topic", async () => {
    mockFetch.mockResolvedValue([
      post(),
      post({ _id: "post-2", title: "FCS Top 25", slug: "fcs-top-25" }),
    ]);
    expect(await sendWeeklyDigest(config, NOW)).toEqual({
      status: "sent",
      broadcastId: "bc_1",
      articles: 2,
    });

    const args = lastBroadcast();
    expect(args).toMatchObject({
      key: "newsletter:weekly:2026-11-22",
      ttlSeconds: 8 * 24 * 60 * 60,
      topic: DIGEST_TOPIC,
    });
    const content = await args.content();
    expect(content).toMatchObject({
      subject: "This week at Redshirt Sports: Montana State wins the Brawl",
      previewText: "2 stories from the week of Nov 15",
    });
    const html = await render(content.react);
    expect(html).toContain("FCS Top 25");
    expect(html).toContain("http://localhost:3000/fcs-top-25");
    expect(html).toContain("{{{RESEND_UNSUBSCRIBE_URL}}}");
    expect(html).toContain('src="https://cdn.sanity.test/logo-dark.png"');
  });

  it("uses the singular for a one-story week", async () => {
    mockFetch.mockResolvedValue([post()]);
    await sendWeeklyDigest(config, NOW);
    expect((await lastBroadcast().content()).previewText).toBe(
      "1 story from the week of Nov 15",
    );
  });

  it("passes on a skip or failure as is", async () => {
    mockFetch.mockResolvedValue([post()]);
    mockBroadcast.mockResolvedValue({ status: "failed", error: "boom" });
    expect(await sendWeeklyDigest(config, NOW)).toEqual({
      status: "failed",
      error: "boom",
    });
  });
});
