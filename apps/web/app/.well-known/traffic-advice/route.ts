/**
 * Chrome's private prefetch proxy reads this before prefetching pages from
 * Google search results. `fraction` is the share of prefetches allowed;
 * replace the entry with `{ user_agent: "prefetch-proxy", disallow: true }`
 * to opt out. Without it the request falls through to the 404 page.
 * Static, so it's served from the CDN without invoking a function.
 * @see https://developer.chrome.com/docs/privacy-security/private-prefetch-proxy-for-network-admins
 */
export function GET() {
  return Response.json(
    [
      {
        user_agent: "prefetch-proxy",
        google_prefetch_proxy_eap: { fraction: 1.0 },
      },
    ],
    { headers: { "Content-Type": "application/trafficadvice+json" } },
  );
}
