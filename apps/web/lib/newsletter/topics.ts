import "server-only";

import { listPolls } from "@redshirt-sports/db/queries";
import { RANKINGS_CACHE_TAG } from "@redshirt-sports/db/rankings-cache-tags";
import { cacheLife, cacheTag } from "next/cache";
import type { Resend } from "resend";

/** Everyone gets the weekly issue unless they turn it off. */
export const DIGEST_TOPIC = {
  name: "The Week in College Sports",
  description: "Every Redshirt Sports story from the week, Sunday mornings.",
  defaultSubscription: "opt_in",
} as const;

type PollLike = { name: string; sport: { name: string } };

/**
 * A poll's topic and checkbox label. Basketball poll names carry the sport
 * ("Men's Basketball Mid-Major Top 25"); football's don't ("FCS Top 25").
 */
export function pollTopicName({ name, sport }: PollLike) {
  return name.startsWith(sport.name) ? name : `${sport.name}: ${name}`;
}

export type TopicSpec = {
  name: string;
  description: string;
  defaultSubscription: "opt_in" | "opt_out";
};

/** Poll alerts are opt-in: nobody gets one they didn't tick. */
export function pollTopic(poll: PollLike): TopicSpec {
  const name = pollTopicName(poll);
  return {
    name,
    description: `The ${name} the moment it's published.`,
    defaultSubscription: "opt_out",
  };
}

/**
 * Resend topic ids for `specs`, by name, creating any that don't exist yet.
 * Topics live in Resend, so a new poll needs no setup: its first signup or
 * alert creates its topic.
 */
export async function ensureTopics(
  resend: Resend,
  specs: TopicSpec[],
): Promise<Map<string, string>> {
  const listed = await resend.topics.list();
  if (listed.error) throw new Error(`Resend topics: ${listed.error.message}`);
  const ids = new Map(listed.data.data.map((topic) => [topic.name, topic.id]));

  for (const spec of specs) {
    if (ids.has(spec.name)) continue;
    const created = await resend.topics.create(spec);
    if (created.error) {
      throw new Error(`Resend topic "${spec.name}": ${created.error.message}`);
    }
    ids.set(spec.name, created.data.id);
  }
  return ids;
}

/** The /newsletter checkboxes: one opt-in alert per active poll. */
export async function getCachedPollOptions() {
  "use cache: remote";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife("days");
  return (await listPolls()).map((poll) => ({
    id: poll.id,
    label: pollTopicName(poll),
  }));
}
