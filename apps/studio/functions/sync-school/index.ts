import { documentEventHandler } from "@sanity/functions";

/**
 * On school create/update, POST the document projection to the web app
 * so Postgres `schools` stays in sync for live rankings display.
 */
export const handler = documentEventHandler(async ({ context, event }) => {
  const { data } = event;
  const { local } = context;

  const target = process.env.SCHOOL_SYNC_URL;
  const secret = process.env.SCHOOL_SYNC_SECRET;

  if (!target || local) {
    console.log(
      `(mock) school sync skipped for ${data._id}; not calling production`,
    );
    return;
  }

  if (!secret) {
    console.error("SCHOOL_SYNC_SECRET is not configured");
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
