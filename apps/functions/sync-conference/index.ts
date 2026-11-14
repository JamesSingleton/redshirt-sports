import { documentEventHandler } from "@sanity/functions";

/**
 * On conference create/update, POST the document projection to the web app
 * so Postgres `conferences`, `conference_sports`, and
 * `conference_sport_subdivisions` (FBS, FCS, Mid-Major, Power Conferences)
 * stay in sync with Sanity. Uses the same secret as sync-school.
 */
export const handler = documentEventHandler(async ({ context, event }) => {
  const { data } = event;
  const { local } = context;

  const target =
    process.env.CONFERENCE_SYNC_URL ??
    "https://www.redshirtsports.com/api/webhooks/sanity/conference";
  const secret = process.env.SCHOOL_SYNC_SECRET;

  if (!secret) {
    console.error("SCHOOL_SYNC_SECRET is not configured");
    return;
  }

  if (local) {
    console.log(
      `(LOCAL TEST MODE) Would sync conference ${data._id} → ${target}`,
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
    body: JSON.stringify({ conference: data }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Conference sync failed (${res.status})`, body);
    return;
  }

  console.log(`Synced conference ${data._id} to Postgres`);
});
