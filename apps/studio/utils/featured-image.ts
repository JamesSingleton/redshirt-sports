const TARGET_RATIO = 16 / 9;
const RATIO_TOLERANCE = 0.02;

/**
 * Featured images must be at least 1920×1080 and 16:9.
 * Sanity asset refs look like `image-<id>-1920x1080-webp`.
 */
export function validateFeaturedImageRef(
  ref: string | undefined,
): true | string {
  if (!ref) return true;
  const match = ref.match(/-(\d+)x(\d+)-/);
  if (!match) {
    return "Featured images must be at least 1920×1080 and 16:9";
  }
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width < 1920 || height < 1080) {
    return "Featured images must be at least 1920×1080";
  }
  const ratio = width / height;
  if (Math.abs(ratio - TARGET_RATIO) > RATIO_TOLERANCE) {
    return "Featured images must be 16:9";
  }
  return true;
}
