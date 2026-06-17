import URLSheriff from "url-sheriff";

const linkCheckSheriff = new URLSheriff({
  allowedSchemes: ["https"],
});

export async function assertPublicHttpUrl(target: URL): Promise<void> {
  if (target.username || target.password) {
    throw new Error("Invalid URL");
  }

  try {
    await linkCheckSheriff.isSafeURL(target);
  } catch {
    throw new Error("Invalid URL");
  }
}

export function resolveLinkCheckTarget(
  rawUrl: string,
  requestUrl: URL,
): URL | null {
  try {
    const target = new URL(rawUrl, requestUrl.origin);
    if (target.protocol !== "https:") {
      return null;
    }
    return target;
  } catch {
    return null;
  }
}
