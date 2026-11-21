import "server-only";

import { listPolls } from "@redshirt-sports/db/queries";

import { pollTopicName } from "./topics";

export type Choices = {
  digest: boolean;
  pollIds: string[];
  /** For the confirm email: "The Week in College Sports…", "FCS Top 25 alerts". */
  labels: string[];
};

const DIGEST_LABEL = "The Week in College Sports, every Sunday morning";

/**
 * What the form asked for. A form without checkboxes (the footer's) marks
 * itself with nothing and means the weekly issue. One with checkboxes sends
 * `choices`, then `digest` and a `poll` per ticked poll. Poll ids that aren't
 * active polls are dropped. Null when nothing is ticked.
 */
export async function readChoices(form: FormData): Promise<Choices | null> {
  if (!form.has("choices")) {
    return { digest: true, pollIds: [], labels: [DIGEST_LABEL] };
  }
  const digest = form.has("digest");
  const asked = new Set(form.getAll("poll").map(String));
  const polls =
    asked.size === 0
      ? []
      : (await listPolls()).filter((poll) => asked.has(poll.id));
  if (!digest && polls.length === 0) return null;
  return {
    digest,
    pollIds: polls.map((poll) => poll.id),
    labels: [
      ...(digest ? [DIGEST_LABEL] : []),
      ...polls.map((poll) => `${pollTopicName(poll)} alerts`),
    ],
  };
}
