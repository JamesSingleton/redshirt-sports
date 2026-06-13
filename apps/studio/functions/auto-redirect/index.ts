import { createClient } from "@sanity/client";
import { documentEventHandler } from "@sanity/functions";

function toPublicPath(documentType: string, slug: string): string {
  const segment = slug.replace(/^\//, "");

  switch (documentType) {
    case "author":
      return `/authors/${segment}`;
    case "school":
      return `/college/teams/${segment}`;
    case "post":
    default:
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
  } catch (error) {
    console.error("Failed to create redirect:", error);
  }
});
