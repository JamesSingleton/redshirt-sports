import { withSentryConfig } from "@sentry/nextjs";

import { keys } from "./keys";

export const sentryConfig: Parameters<typeof withSentryConfig>[1] = {
  org: keys().SENTRY_ORG,
  project: keys().SENTRY_PROJECT,
  authToken: keys().SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  telemetry: false,
};

export const withSentry = (sourceConfig: object): object => {
  return withSentryConfig(sourceConfig, sentryConfig);
};
