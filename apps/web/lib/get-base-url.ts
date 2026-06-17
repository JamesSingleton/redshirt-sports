function resolveConfiguredPublicUrl() {
  const host =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;

  if (!host) {
    return undefined;
  }

  return host.startsWith("http") ? host : `https://${host}`;
}

function resolveProductionHost() {
  return (
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.NEXT_PUBLIC_SITE_URL
  );
}

function resolveServerProductionUrl() {
  const configuredPublicUrl = resolveConfiguredPublicUrl();
  if (configuredPublicUrl) {
    return configuredPublicUrl;
  }

  const host = resolveProductionHost();
  if (host) {
    return `https://${host}`;
  }

  return undefined;
}

function isLocalDevHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    // Local dev should always use the browser origin (share links, JSON-LD, etc.)
    if (isLocalDevHost(window.location.hostname)) {
      return window.location.origin;
    }

    return resolveConfiguredPublicUrl() ?? window.location.origin;
  }

  if (process.env.VERCEL_ENV === "production") {
    const productionUrl = resolveServerProductionUrl();
    if (!productionUrl) {
      throw new Error(
        "Production base URL is not configured. Set VERCEL_PROJECT_PRODUCTION_URL or NEXT_PUBLIC_SITE_URL.",
      );
    }

    return productionUrl;
  }

  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
};
