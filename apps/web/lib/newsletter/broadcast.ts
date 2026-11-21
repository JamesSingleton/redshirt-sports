import "server-only";

import * as Sentry from "@sentry/nextjs";
import type { ReactElement } from "react";

import redis from "@/utils/redis";
import type { NewsletterConfig } from "./config";
import { ensureTopics, type TopicSpec } from "./topics";

/** Resend swaps this for each recipient's own unsubscribe link. */
export const RESEND_UNSUBSCRIBE_URL = "{{{RESEND_UNSUBSCRIBE_URL}}}";

export type BroadcastResult =
  | { status: "sent"; broadcastId: string }
  | { status: "skipped"; reason: "already-sent" }
  | { status: "failed"; error: string };

type Content = {
  name: string;
  subject: string;
  previewText: string;
  react: ReactElement;
};

/**
 * Sends one broadcast to the readers subscribed to `topic`, at most once per
 * `key`. The key is claimed in Redis first, so a doubled or retried run sends
 * nothing; a failed send frees it again so the next run can try.
 */
export async function broadcastOnce(
  config: NewsletterConfig,
  {
    key,
    ttlSeconds,
    topic,
    content,
  }: {
    key: string;
    ttlSeconds: number;
    topic: TopicSpec;
    content: () => Promise<Content>;
  },
): Promise<BroadcastResult> {
  const claimed = await redis.set(key, new Date().toISOString(), {
    nx: true,
    ex: ttlSeconds,
  });
  if (claimed !== "OK") return { status: "skipped", reason: "already-sent" };

  const error = await send(config, topic, content).catch((thrown: unknown) => ({
    error: thrown instanceof Error ? thrown.message : String(thrown),
  }));
  if ("broadcastId" in error) return { status: "sent", ...error };

  await redis.del(key);
  Sentry.captureMessage(`Broadcast ${key} failed: ${error.error}`, "error");
  return { status: "failed", error: error.error };
}

async function send(
  { resend, from, segmentId }: NewsletterConfig,
  topic: TopicSpec,
  content: () => Promise<Content>,
): Promise<{ broadcastId: string } | { error: string }> {
  const topicId = (await ensureTopics(resend, [topic])).get(topic.name);
  const { data, error } = await resend.broadcasts.create({
    ...(await content()),
    from,
    segmentId,
    topicId,
    send: true,
  });
  if (error || !data) {
    return { error: error?.message ?? "Resend returned no broadcast" };
  }
  return { broadcastId: data.id };
}
