import { newsletterConfig } from "@/lib/newsletter/config";
import { sendWeeklyDigest } from "@/lib/newsletter/weekly-digest";
import { safeCompare } from "@/lib/safe-compare";

export const maxDuration = 60;

/**
 * Vercel Schedule, Sunday morning Eastern: the weekly newsletter. Sends the
 * past seven days of articles, or nothing in a week without any.
 */
export async function GET(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error(
      "CRON_SECRET is not set; refusing to run the newsletter cron.",
    );
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

  const result = await sendWeeklyDigest(config, new Date());
  return Response.json(result, {
    status: result.status === "failed" ? 500 : 200,
  });
}
