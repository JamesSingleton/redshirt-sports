/** `/design` is a local component gallery. Production requests 404. */
export function isDesignRouteEnabled(
  nodeEnv: string | undefined = process.env.NODE_ENV,
) {
  return nodeEnv !== "production";
}
