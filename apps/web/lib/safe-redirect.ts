/**
 * Resolve a user-supplied redirect target to a same-origin path.
 * Accepts relative paths and absolute URLs on `origin` (the proxy passes the
 * full request URL); anything off-site or non-http returns null.
 */
export function safeRedirectPath(
  value: string | null | undefined,
  origin: string,
): string | null {
  if (!value) return null;

  let target: URL;
  try {
    target = new URL(value, origin);
  } catch {
    return null;
  }

  if (target.origin !== origin) return null;

  return `${target.pathname}${target.search}${target.hash}`;
}
