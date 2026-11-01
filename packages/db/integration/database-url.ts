/**
 * Integration tests write to and truncate a real database, so they only run
 * against a dedicated local one: never the dev database, never a remote host.
 */
export const INTEGRATION_DATABASE_NAME = "redshirt_it";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

export function integrationDatabaseUrl(): string {
  const url =
    process.env.INTEGRATION_DATABASE_URL ??
    `postgresql://postgres:postgres@127.0.0.1:54322/${INTEGRATION_DATABASE_NAME}`;
  assertIntegrationDatabaseUrl(url);
  return url;
}

export function assertIntegrationDatabaseUrl(url: string) {
  const parsed = new URL(url);
  if (!LOCAL_HOSTS.has(parsed.hostname)) {
    throw new Error(
      `Refusing to run integration tests against non-local host ${parsed.hostname}`,
    );
  }
  if (parsed.pathname !== `/${INTEGRATION_DATABASE_NAME}`) {
    throw new Error(
      `Refusing to run integration tests against database ${parsed.pathname.slice(1)}; expected ${INTEGRATION_DATABASE_NAME}`,
    );
  }
}

/** Same server, maintenance database: used to create the test database. */
export function maintenanceDatabaseUrl(url: string): string {
  const parsed = new URL(url);
  parsed.pathname = "/postgres";
  return parsed.toString();
}
