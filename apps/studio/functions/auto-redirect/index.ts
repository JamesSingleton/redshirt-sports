import { documentEventHandler } from "@sanity/functions";

export const handler = documentEventHandler(async () => {
  // Slugs are locked after the document is saved. A new public URL is a
  // manual legacy redirect in Studio, not something this function creates.
  console.log("auto-redirect is retired; slug changes do not create redirects");
});
