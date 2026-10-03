import type { init } from "@sentry/nextjs";

type DataCollection = NonNullable<
  NonNullable<Parameters<typeof init>[0]>["dataCollection"]
>;

const sensitiveKeys = ["forwarded", "-ip", "remote-", "via", "-user"];

/**
 * Matches the SDK v10 defaults with `sendDefaultPii` unset. v11 collects
 * user info, cookies, request/response bodies, and DB query data by default.
 */
export const dataCollection: DataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: sensitiveKeys },
    response: { deny: sensitiveKeys },
  },
  httpBodies: [],
  urlQueryParams: { deny: sensitiveKeys },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  graphQL: { document: false, variables: false },
  frameContextLines: 7,
};
