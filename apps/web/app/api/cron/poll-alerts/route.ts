import { newsletterConfig } from "@/lib/newsletter/config";
import { sendPollAlerts } from "@/lib/newsletter/poll-alerts";
import { safeCompare } from "@/lib/safe-compare";

export const maxDuration = 60;

/**
 * Vercel Schedule, every 15 minutes: emails each newly published Top 25 to
 * the readers who opted in to that poll. Usually finds nothing.
 */
export async function GET(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not set; refusing to run poll alerts.");
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
  if (!safeCompare(header, `Bearer ${secret}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = newsletterConfig();
  if (!config) {
    console.error("Newsletter env is incomplete; refusing to send.");
    return Response.json(
      { error: "Newsletter not configured" },
      { status: 500 },
    );
  }

  const results = await sendPollAlerts(config, new Date());
  const failed = results.some((result) => result.status === "failed");
  return Response.json({ results }, { status: failed ? 500 : 200 });
}
