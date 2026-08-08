import { render, screen } from "@testing-library/react";

import {
  getAndCacheTweet,
  ReactTweet,
  TweetContent,
} from "@/components/tweet";

const { mockFetchTweet, mockRedisSet, mockRedisDel } = vi.hoisted(() => ({
  mockFetchTweet: vi.fn(),
  mockRedisSet: vi.fn(),
  mockRedisDel: vi.fn(),
}));

vi.mock("react-tweet/api", () => ({
  fetchTweet: mockFetchTweet,
}));

vi.mock("react-tweet", () => ({
  EmbeddedTweet: ({ tweet }: { tweet: { id_str: string } }) => (
    <div data-testid="embedded-tweet">{tweet.id_str}</div>
  ),
  TweetNotFound: ({ error }: { error?: unknown }) => (
    <div data-testid="tweet-not-found">{error ? "error" : "missing"}</div>
  ),
  TweetSkeleton: () => <div data-testid="tweet-skeleton">loading</div>,
}));

vi.mock("@/utils/redis", () => ({
  default: {
    set: mockRedisSet,
    del: mockRedisDel,
  },
}));

describe("getAndCacheTweet", () => {
  beforeEach(() => {
    mockFetchTweet.mockReset();
    mockRedisSet.mockReset();
    mockRedisDel.mockReset();
  });

  it("caches fetched tweet data", async () => {
    mockFetchTweet.mockResolvedValue({
      data: { id_str: "123" },
      tombstone: false,
      notFound: false,
    });

    await expect(getAndCacheTweet("123")).resolves.toEqual({ id_str: "123" });
    expect(mockRedisSet).toHaveBeenCalledWith("tweet:123", { id_str: "123" });
  });

  it("deletes cache entries for tombstoned tweets", async () => {
    mockFetchTweet.mockResolvedValue({
      data: undefined,
      tombstone: true,
      notFound: false,
    });

    await expect(getAndCacheTweet("missing")).resolves.toBeUndefined();
    expect(mockRedisDel).toHaveBeenCalledWith("tweet:missing");
  });

  it("deletes cache entries when tweet is not found", async () => {
    mockFetchTweet.mockResolvedValue({
      data: undefined,
      tombstone: false,
      notFound: true,
    });

    await expect(getAndCacheTweet("not-found")).resolves.toBeUndefined();
    expect(mockRedisDel).toHaveBeenCalledWith("tweet:not-found");
  });

  it("logs and returns undefined when fetch fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockFetchTweet.mockRejectedValue(new Error("network"));

    await expect(getAndCacheTweet("error")).resolves.toBeUndefined();
    consoleSpy.mockRestore();
  });
});

describe("TweetContent", () => {
  beforeEach(() => {
    mockFetchTweet.mockReset();
    mockRedisSet.mockReset();
    mockRedisDel.mockReset();
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

  it("renders not found when tweet data is missing", async () => {
    mockFetchTweet.mockResolvedValue({
      data: undefined,
      tombstone: false,
      notFound: true,
    });

    render(await TweetContent({ id: "missing" }));
    expect(screen.getByTestId("tweet-not-found")).toHaveTextContent("missing");
  });
});

describe("ReactTweet", () => {
  it("renders the suspense fallback skeleton", () => {
    render(<ReactTweet id="123" />);
    expect(screen.getByTestId("tweet-skeleton")).toBeInTheDocument();
  });
});
