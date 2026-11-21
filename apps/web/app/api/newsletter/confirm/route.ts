import { listPolls } from "@redshirt-sports/db/queries";
import * as Sentry from "@sentry/nextjs";

import type { NewsletterConfig } from "@/lib/newsletter/config";
import { newsletterConfig } from "@/lib/newsletter/config";
import type { ConfirmStatus } from "@/lib/newsletter/signup";
import { type Subscription, verifyConfirmToken } from "@/lib/newsletter/token";
import { DIGEST_TOPIC, ensureTopics, pollTopic } from "@/lib/newsletter/topics";

/** Back to the signup page, which shows what happened (see `CONFIRM_MESSAGES`). */
function redirectTo(request: Request, status: ConfirmStatus) {
  const url = new URL("/newsletter", request.url);
  url.searchParams.set("status", status);
  return Response.redirect(url, 303);
}

type TopicChoice = { id: string; subscription: "opt_in" | "opt_out" };

/** The reader's topic choices as Resend ids. */
async function topicChoices(
  { resend }: NewsletterConfig,
  { digest, pollIds }: Subscription,
) {
  const polls = (await listPolls()).filter((poll) => pollIds.includes(poll.id));
  const pollSpecs = polls.map(pollTopic);
  const ids = await ensureTopics(resend, [DIGEST_TOPIC, ...pollSpecs]);
  const id = (name: string) => ids.get(name) as string;
  return {
    digest: {
      id: id(DIGEST_TOPIC.name),
      subscription: digest ? "opt_in" : "opt_out",
    } satisfies TopicChoice,
    polls: pollSpecs.map(
      (spec): TopicChoice => ({ id: id(spec.name), subscription: "opt_in" }),
    ),
  };
}

/**
 * Adds the reader to the segment with the topics they ticked. Someone who
 * signed up before already has a contact: they're resubscribed and the new
 * picks are added, but nothing they chose earlier is turned off.
 */
async function subscribe(config: NewsletterConfig, subscription: Subscription) {
  const { resend, segmentId } = config;
  const { email } = subscription;
  const topics = await topicChoices(config, subscription);

  const created = await resend.contacts.create({
    email,
    unsubscribed: false,
    segments: [{ id: segmentId }],
    // A new reader who left the weekly issue unticked opts out of it.
    topics: [topics.digest, ...topics.polls],
  });
  if (!created.error) return null;

  const updated = await resend.contacts.update({ email, unsubscribed: false });
  if (updated.error) return updated.error.message;
  const added = await resend.contacts.segments.add({ email, segmentId });
  if (added.error) return added.error.message;
  const optIns = [
    ...(subscription.digest ? [topics.digest] : []),
    ...topics.polls,
  ];
  if (optIns.length === 0) return null;
  const opted = await resend.contacts.topics.update({ email, topics: optIns });
  return opted.error?.message ?? null;
}

/** Step two of double opt-in: the link from the confirm email lands here. */
export async function GET(request: Request) {
  const config = newsletterConfig();
  if (!config) return redirectTo(request, "error");

  const token = new URL(request.url).searchParams.get("token") ?? "";
  const subscription = verifyConfirmToken(token, config.signingSecret);
  if (!subscription) return redirectTo(request, "invalid");

  const failure = await subscribe(config, subscription).catch(
    (error: unknown) =>
      error instanceof Error ? error.message : String(error),
  );
  if (failure) {
    Sentry.captureMessage(`Newsletter confirm failed: ${failure}`, "error");
    return redirectTo(request, "error");
  }
  return redirectTo(request, "confirmed");
}
