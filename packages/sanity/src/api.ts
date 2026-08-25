import { keys } from "../keys";

const env = keys();

export const dataset = env.NEXT_PUBLIC_SANITY_DATASET;

export const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID;

/**
 * see https://www.sanity.io/docs/api-versioning for how versioning works
 */
export const apiVersion = env.NEXT_PUBLIC_SANITY_API_VERSION;

/**
 * Used to configure edit intent links, for Presentation Mode, as well as to configure where the Studio is mounted in the router.
 */
export const studioUrl =
  env.NEXT_PUBLIC_SANITY_STUDIO_URL ?? "http://localhost:3333";
