/**
 * Origins allowed to mint a Clerk session for Redshirt apps.
 * Localhost ports do not share cookies. They are listed so the dev instance can sign in.
 * Production hosts are the shared-session subdomains from blueprint §6.1a.
 */
export const AUTHORIZED_PARTIES = [
  "https://www.redshirtsports.com",
  "https://vote.redshirtsports.com",
  "https://admin.redshirtsports.com",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
] as const;

/**
 * Clerk `authorizedParties`, plus any explicitly configured app origins.
 * Preview and local hosts stay out of the constant until they are set in env.
 */
export function resolveAuthorizedParties(
  env: Record<string, string | undefined> = process.env,
): string[] {
  const configured = [
    env.NEXT_PUBLIC_SITE_URL,
    env.NEXT_PUBLIC_VOTE_URL,
    env.NEXT_PUBLIC_ADMIN_URL,
  ].flatMap((value) => {
    const trimmed = value?.trim().replace(/\/$/, "");
    if (!trimmed) return [];
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return [trimmed];
    }
    return [`https://${trimmed}`];
  });
  return [...new Set<string>([...AUTHORIZED_PARTIES, ...configured])];
}
