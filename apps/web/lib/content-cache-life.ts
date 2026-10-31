/**
 * Long-lived cache profile for layout chrome and low-churn Sanity slices.
 * Matches rankings backup TTL — not the short Sanity live-preview default.
 */
export const CONTENT_CACHE_LIFE = {
  stale: 300,
  revalidate: 604800,
  expire: 2592000,
} as const;
