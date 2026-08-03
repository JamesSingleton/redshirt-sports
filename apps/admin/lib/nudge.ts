import { PUBLIC_SITE_URL } from "@/lib/site";

export function buildNudgeMessage({
  firstName,
  pollName,
  sportSlug,
  division,
}: {
  firstName: string;
  pollName: string;
  sportSlug: string;
  division: string;
}) {
  const voteUrl = `${PUBLIC_SITE_URL}/vote/college/${sportSlug}/${division}`;
  return `Hi ${firstName || "there"},\n\nReminder to submit your ${pollName} Top 25 ballot by Sunday night:\n${voteUrl}\n\nThanks!`;
}
