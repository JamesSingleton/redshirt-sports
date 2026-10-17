import { createClient } from "@sanity/client";
import { documentEventHandler } from "@sanity/functions";

import { redirectsToRepoint } from "./chain";

/**
 * Public path for the slug as the site serves it today.
 * These shapes (`/authors/x`, `/college/teams/x`, root `/x`) move with #18.
 * Update this function in the same PR as each move. Do not emit blueprint
 * paths (`/people`, `/teams`, `/college/{sport}/news`) before those routes exist.
 * `primarySport` changes start creating redirects in that same PR: today's
 * article URL is the root slug, so a sport change does not move a public path yet.
 */
function toPublicPath(documentType: string, slug: string): string {
  const segment = slug.replace(/^\//, "");

  switch (documentType) {
    case "author":
      return `/authors/${segment}`;
    case "school":
      return `/college/teams/${segment}`;
    default:
      // post, and any other type, uses the slug as a root path today
      return slug.startsWith("/") ? slug : `/${segment}`;
  }
}

export const handler = documentEventHandler(async ({ context, event }) => {
  const client = createClient({
    ...context.clientOptions,
    apiVersion: "2025-07-17",
    useCdn: false,
  });

  const { beforeSlug, slug, _type: documentType } = event.data;

  if (!slug || !beforeSlug || !documentType) {
    console.log("Missing slug, beforeSlug, or document type");
    return;
  }

  const source = toPublicPath(documentType, beforeSlug);
  const destination = toPublicPath(documentType, slug);

  if (source === destination) {
    console.log("Slug path did not change");
    return;
  }

  const existingRedirect = await client.fetch(
    `*[_type == "redirect" && source.current == $source][0]`,
    { source },
  );
  if (existingRedirect) {
    console.log(`Redirect already exists for source ${source}`);
    return;
  }

  const loopRedirect = await client.fetch(
    `*[_type == "redirect" && source.current == $destination && destination.current == $source][0]`,
    { destination, source },
  );
  if (loopRedirect) {
    console.log("Redirect loop detected");
    return;
  }

  const redirect = {
    _type: "redirect",
    source: {
      _type: "slug",
      current: source,
    },
    destination: {
      _type: "slug",
      current: destination,
    },
    permanent: true,
  };

  try {
    const res = await client.create(redirect);
    console.log(
      `Redirect from ${source} to ${destination} was created ${JSON.stringify(res)}`,
    );

    const chained = await client.fetch<Array<{ _id: string; source: string }>>(
      `*[_type == "redirect" && destination.current == $source && !(_id in path("drafts.**"))]{ _id, "source": source.current }`,
      { source },
    );
    for (const row of redirectsToRepoint(chained, source, destination)) {
      await client
        .patch(row._id)
        .set({ "destination.current": destination })
        .commit();
      console.log(`Collapsed redirect ${row.source} → ${destination}`);
    }
  } catch (error) {
    console.error("Failed to create redirect:", error);
  }
});
