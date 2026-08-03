import { documentEventHandler } from "@sanity/functions";

/**
 * On school create/update, POST the document projection to the web app
 * so Postgres `schools` stays in sync for live rankings display.
 */
export const handler = documentEventHandler(async ({ context, event }) => {
  const { data } = event;
  const { local } = context;

  const target =
    process.env.SCHOOL_SYNC_URL ??
    "https://www.redshirtsports.xyz/api/webhooks/sanity/school";
  const secret = process.env.SCHOOL_SYNC_SECRET;

  if (!secret) {
    console.error("SCHOOL_SYNC_SECRET is not configured");
    return;
  }

  if (local) {
    console.log(
      `(LOCAL TEST MODE) Would sync school ${data._id} → ${target}`,
      data,
    );
    return;
  }

  const res = await fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ school: data }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`School sync failed (${res.status})`, body);
    return;
  }

  console.log(`Synced school ${data._id} to Postgres`);
});
