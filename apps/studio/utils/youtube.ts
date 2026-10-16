export function getYouTubeId(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^(www|m)\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      return (
        u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1] ?? null
      );
    }
  } catch {
    // invalid URL
  }
  return null;
}
