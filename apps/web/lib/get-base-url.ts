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

export const getBaseUrl = () => {
  if (typeof window !== "undefined") {
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
