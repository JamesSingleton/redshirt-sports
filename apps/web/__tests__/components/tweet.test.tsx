import { act, render, screen } from "@testing-library/react";

import { getAndCacheTweet, ReactTweet, TweetContent } from "@/components/tweet";

const {
  mockFetchTweet,
  mockRedisGet,
  mockRedisSet,
  mockRedisDel,
  mockCacheLife,
} = vi.hoisted(() => ({
  mockFetchTweet: vi.fn(),
  mockRedisGet: vi.fn(),
  mockRedisSet: vi.fn(),
  mockRedisDel: vi.fn(),
  mockCacheLife: vi.fn(),
}));

vi.mock("next/cache", () => ({
  cacheLife: mockCacheLife,
  cacheTag: vi.fn(),
}));

vi.mock("react-tweet/api", () => ({
  fetchTweet: mockFetchTweet,
}));

vi.mock("react-tweet", () => ({
  EmbeddedTweet: ({ tweet }: { tweet: { id_str: string } }) => (
    <div data-testid="embedded-tweet">{tweet.id_str}</div>
  ),
  TweetSkeleton: () => <div data-testid="tweet-skeleton">loading</div>,
}));

vi.mock("@/utils/redis", () => ({
  default: {
    get: mockRedisGet,
    set: mockRedisSet,
    del: mockRedisDel,
  },
}));

describe("getAndCacheTweet", () => {
  beforeEach(() => {
    mockFetchTweet.mockReset();
    mockRedisGet.mockReset().mockResolvedValue(null);
    mockRedisSet.mockReset();
    mockRedisDel.mockReset();
    mockCacheLife.mockReset();
  });

  it("caches fetched tweet data", async () => {
    mockFetchTweet.mockResolvedValue({
      data: { id_str: "123" },
      tombstone: false,
      notFound: false,
    });

    await expect(getAndCacheTweet("123")).resolves.toEqual({
      status: "ok",
      tweet: { id_str: "123" },
    });
    expect(mockRedisSet).toHaveBeenCalledWith("tweet:123", { id_str: "123" });
    expect(mockCacheLife).toHaveBeenCalledWith("max");
  });

  it("serves a stored tweet from redis without calling Twitter", async () => {
    mockRedisGet.mockResolvedValue({ id_str: "456" });

    await expect(getAndCacheTweet("456")).resolves.toEqual({
      status: "ok",
      tweet: { id_str: "456" },
    });
    expect(mockRedisGet).toHaveBeenCalledWith("tweet:456");
    expect(mockFetchTweet).not.toHaveBeenCalled();
    expect(mockCacheLife).toHaveBeenCalledWith("max");
  });

  it("deletes cache entries for tombstoned tweets", async () => {
    mockFetchTweet.mockResolvedValue({
      data: undefined,
      tombstone: true,
      notFound: false,
    });

    await expect(getAndCacheTweet("missing")).resolves.toEqual({
      status: "unavailable",
    });
    expect(mockRedisDel).toHaveBeenCalledWith("tweet:missing");
    expect(mockCacheLife).toHaveBeenCalledWith("days");
  });

  it("deletes cache entries when tweet is not found", async () => {
    mockFetchTweet.mockResolvedValue({
      data: null,
      tombstone: false,
      notFound: true,
    });

    await expect(getAndCacheTweet("not-found")).resolves.toEqual({
      status: "unavailable",
    });
    expect(mockRedisDel).toHaveBeenCalledWith("tweet:not-found");
  });

  it("leaves cache alone when fetch returns no data and no tombstone flags", async () => {
    mockFetchTweet.mockResolvedValue({
      data: undefined,
      tombstone: false,
      notFound: false,
    });

    await expect(getAndCacheTweet("empty")).resolves.toEqual({
      status: "error",
    });
    expect(mockRedisDel).not.toHaveBeenCalled();
    expect(mockRedisSet).not.toHaveBeenCalled();
    expect(mockCacheLife).toHaveBeenCalledWith("hours");
  });

  it("still fetches from Twitter when redis is unavailable", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockRedisGet.mockRejectedValue(new Error("ECONNREFUSED"));
    mockRedisSet.mockRejectedValue(new Error("ECONNREFUSED"));
    mockFetchTweet.mockResolvedValue({
      data: { id_str: "321" },
      tombstone: false,
      notFound: false,
    });

    await expect(getAndCacheTweet("321")).resolves.toEqual({
      status: "ok",
      tweet: { id_str: "321" },
    });
    expect(mockCacheLife).toHaveBeenCalledWith("max");
    consoleSpy.mockRestore();
  });

  it("logs and returns undefined when fetch fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetchTweet.mockRejectedValue(new Error("network"));

    await expect(getAndCacheTweet("error")).resolves.toEqual({
      status: "error",
    });
    expect(mockCacheLife).toHaveBeenCalledWith("hours");
    consoleSpy.mockRestore();
  });
});

describe("TweetContent", () => {
  beforeEach(() => {
    mockFetchTweet.mockReset();
    mockRedisGet.mockReset().mockResolvedValue(null);
    mockRedisSet.mockReset();
    mockRedisDel.mockReset();
    mockCacheLife.mockReset();
  });

  it("renders the embedded tweet when data exists", async () => {
    mockFetchTweet.mockResolvedValue({
      data: { id_str: "123" },
      tombstone: false,
      notFound: false,
    });

    render(await TweetContent({ id: "123" }));
    expect(screen.getByTestId("embedded-tweet")).toHaveTextContent("123");
  });

  it("renders nothing for a deleted tweet", async () => {
    mockFetchTweet.mockResolvedValue({
      data: undefined,
      tombstone: true,
      notFound: false,
    });

    await expect(TweetContent({ id: "missing" })).resolves.toBeNull();
  });

  it("links to the post on X when Twitter can't be reached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetchTweet.mockRejectedValue(new Error("network"));

    render(await TweetContent({ id: "789" }));
    expect(
      screen.getByRole("link", { name: "View this post on X" }),
    ).toHaveAttribute("href", "https://x.com/i/status/789");
  });
});

describe("ReactTweet", () => {
  it("renders the suspense fallback skeleton", async () => {
    mockFetchTweet.mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      render(<ReactTweet id="123" />);
    });

    expect(screen.getByTestId("tweet-skeleton")).toBeInTheDocument();
  });
});
