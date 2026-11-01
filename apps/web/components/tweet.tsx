import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import { EmbeddedTweet, TweetSkeleton } from "react-tweet";
import { fetchTweet, type Tweet } from "react-tweet/api";

import redis from "@/utils/redis";

export type TweetResult =
  | { status: "ok"; tweet: Tweet }
  /** Deleted, private, or suspended: Twitter says it's gone. */
  | { status: "unavailable" }
  /** Twitter couldn't be reached or returned nothing; worth retrying. */
  | { status: "error" };

/** Redis is an optimization; an outage should fall through to Twitter. */
async function bestEffort<T>(op: () => Promise<T>): Promise<T | undefined> {
  try {
    return await op();
  } catch (error) {
    console.error("tweet redis cache unavailable:", error);
    return undefined;
  }
}

/**
 * Tweet data for an embed, cached into the article's static shell.
 * Redis is a read-through store so rebuilds don't re-hit Twitter for tweets
 * already seen. Lifetimes stay at `hours` or longer so the embed is never a
 * request-time hole (that would invoke a function on every article view).
 */
export async function getAndCacheTweet(id: string): Promise<TweetResult> {
  "use cache";
  cacheTag(`tweet:${id}`);

  const stored = await bestEffort(() => redis.get<Tweet>(`tweet:${id}`));
  if (stored) {
    cacheLife("max");
    return { status: "ok", tweet: stored };
  }

  try {
    const { data, tombstone, notFound } = await fetchTweet(id);

    if (data) {
      await bestEffort(() => redis.set(`tweet:${id}`, data));
      cacheLife("max");
      return { status: "ok", tweet: data };
    }
    if (tombstone || notFound) {
      // Gone on Twitter's side; recheck occasionally in case it was restored.
      await bestEffort(() => redis.del(`tweet:${id}`));
      cacheLife("days");
      return { status: "unavailable" };
    }
  } catch (error) {
    console.error("fetching the tweet failed with:", error);
  }

  // Transient failure: retry within the hour instead of pinning a fallback.
  cacheLife("hours");
  return { status: "error" };
}

function tweetUrl(id: string) {
  return `https://x.com/i/status/${encodeURIComponent(id)}`;
}

export function TweetLinkFallback({ id }: { id: string }) {
  return (
    <p
      className="my-6 w-full max-w-[550px] rounded-xl border px-4 py-3 text-center text-sm"
      data-testid="tweet-link-fallback"
    >
      <a
        href={tweetUrl(id)}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium underline underline-offset-4 hover:text-primary"
      >
        View this post on X
      </a>
    </p>
  );
}

export const TweetContent = async ({ id }: { id: string }) => {
  const result = await getAndCacheTweet(id);
  if (result.status === "ok") return <EmbeddedTweet tweet={result.tweet} />;
  // Deleted or private tweets drop out of the article entirely.
  if (result.status === "unavailable") return null;
  return <TweetLinkFallback id={id} />;
};

export const ReactTweet = ({ id }: { id: string }) => {
  return (
    <Suspense fallback={<TweetSkeleton />}>
      <TweetContent id={id} />
    </Suspense>
  );
};
