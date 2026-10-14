/**
 * Origins allowed to mint a Clerk session for Redshirt apps.
 * Localhost ports do not share cookies; they are listed so the dev instance can sign in.
 */
export const AUTHORIZED_PARTIES = [
  "https://www.redshirtsports.com",
  "https://vote.redshirtsports.com",
  "https://admin.redshirtsports.com",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
] as const;
