/** True when the page is embedded in Sanity Presentation or draft mode is active. */
export function isPreviewSession(): boolean {
  if (typeof window === "undefined") return false;

  if (window.self !== window.top) {
    return true;
  }

  const cookies = document.cookie;

  return (
    cookies.includes("__prerender_bypass=") ||
    cookies.includes("sanity-preview-perspective=")
  );
}
