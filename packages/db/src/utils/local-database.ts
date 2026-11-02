const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

export function isLocalDatabaseUrl(url: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Throw unless the URL points at a database on this machine. */
export function assertLocalDatabaseUrl(url: string | undefined): string {
  if (!url) {
    throw new Error("No database URL was given.");
  }
  if (!isLocalDatabaseUrl(url)) {
    let host = "an unparsable URL";
    try {
      host = new URL(url).hostname;
    } catch {}
    throw new Error(`Refusing to write to non-local database host ${host}.`);
  }
  return url;
}
