import { getPresentationUrl } from "@/utils/helper";

export function toAbsoluteLinkUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return new URL(url, getPresentationUrl()).toString();
}

export function normalizeLinkUrl(url?: string): string | undefined {
  if (!url) {
    return undefined;
  }

  return toAbsoluteLinkUrl(url);
}

export function isVisitableLinkUrl(url?: string): url is string {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url.includes("://") ? url : toAbsoluteLinkUrl(url));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
