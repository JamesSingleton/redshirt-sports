import { syncTagInvalidateEventHandler } from "@sanity/functions";

async function ack(
  done: (tags: string[]) => Promise<Response>,
  tags: string[],
) {
  const start = performance.now();
  try {
    const response = await done(tags);
    const ms = Math.round(performance.now() - start);
    console.info(`done() responded with HTTP ${response.status} (${ms}ms)`);
  } catch (error) {
    const ms = Math.round(performance.now() - start);
    console.error(`Error invoking done callback (${ms}ms)`, error);
  }
}

async function expireTags(target: URL, tags: string[], secret: string) {
  const start = performance.now();
  const res = await fetch(target, {
    body: JSON.stringify({ secret, tags }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const ms = Math.round(performance.now() - start);

  if (res.ok) {
    console.info(
      `Revalidated ${tags.length} tags via ${target} (${ms}ms)`,
      res.status,
    );
  } else {
    const body = await res.text();
    console.error(`Non-OK response from ${target} (${ms}ms)`, res.status, body);
  }
}

export const handler = syncTagInvalidateEventHandler(
  async ({ event, done }) => {
    const start = performance.now();
    const { syncTags } = event.data;

    const target = new URL(
      "https://www.redshirtsports.xyz/api/revalidate-tags",
    );
    console.info(`Forwarding ${syncTags.length} tags to api`);

    const secret = process.env.SANITY_REVALIDATE_SECRET!;
    await expireTags(target, syncTags, secret);

    await ack(done, syncTags);
    console.info(
      `Total handler time: ${Math.round(performance.now() - start)}ms`,
    );
  },
);
