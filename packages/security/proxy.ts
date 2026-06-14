import {
  defaults as noseconeDefaults,
  type Options,
  withVercelToolbar,
} from "@nosecone/next";

export {
  createMiddleware as securityMiddleware,
  nosecone,
} from "@nosecone/next";

const contentSecurityPolicy: Options["contentSecurityPolicy"] = {
  ...noseconeDefaults.contentSecurityPolicy,
  directives: {
    ...noseconeDefaults.contentSecurityPolicy.directives,
    scriptSrc: [
      ...noseconeDefaults.contentSecurityPolicy.directives.scriptSrc,
      "'unsafe-inline'",
      "https://*.clerk.accounts.dev",
      "https://va.vercel-scripts.com",
      "https://*.posthog.com",
    ],
    connectSrc: [
      ...noseconeDefaults.contentSecurityPolicy.directives.connectSrc,
      "*",
      "https://*.clerk.accounts.dev",
      "https://clerk-telemetry.com",
      "https://*.posthog.com",
    ],
    workerSrc: [
      ...noseconeDefaults.contentSecurityPolicy.directives.workerSrc,
      "blob:",
      "https://*.clerk.accounts.dev",
    ],
    imgSrc: [
      ...noseconeDefaults.contentSecurityPolicy.directives.imgSrc,
      "https://cdn.sanity.io",
      "https://img.clerk.com",
    ],
    objectSrc: [...noseconeDefaults.contentSecurityPolicy.directives.objectSrc],
    upgradeInsecureRequests: process.env.NODE_ENV === "production",
  },
};

export const noseconeOptions: Options = {
  ...noseconeDefaults,
  contentSecurityPolicy,
  crossOriginEmbedderPolicy: {
    // Default `require-corp` blocks cross-origin images from Sanity CDN (and
    // most other CDNs) that don't send Cross-Origin-Resource-Policy headers.
    policy: "credentialless",
  },
};

export const noseconeOptionsWithToolbar: Options =
  withVercelToolbar(noseconeOptions);
