import type { SanityImageSource } from "@sanity/image-url";
import { createImageUrlBuilder } from "@sanity/image-url";
import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId, studioUrl } from "./api";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === "production",
  perspective: "published",
  stega: {
    studioUrl,
  },
});

const imageBuilder = createImageUrlBuilder({
  projectId: projectId,
  dataset: dataset,
});

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * @sanity/image-url skips applying hotspot/crop defaults when both objects exist.
 * Incomplete hotspots (e.g. GROQ projecting only x/y) then produce `rect=...,NaN,...`.
 */
function normalizeImageSource(source: SanityImageSource): SanityImageSource {
  if (!source || typeof source !== "object") {
    return source;
  }

  const image = source as Record<string, unknown>;
  const hotspot = image.hotspot;
  if (!hotspot || typeof hotspot !== "object") {
    return source;
  }

  const h = hotspot as Record<string, unknown>;
  if (
    isFiniteNumber(h.x) &&
    isFiniteNumber(h.y) &&
    isFiniteNumber(h.height) &&
    isFiniteNumber(h.width)
  ) {
    return source;
  }

  if (!isFiniteNumber(h.x) || !isFiniteNumber(h.y)) {
    const { hotspot: _hotspot, ...rest } = image;
    return rest as SanityImageSource;
  }

  return {
    ...image,
    hotspot: {
      ...h,
      height: isFiniteNumber(h.height) ? h.height : 1,
      width: isFiniteNumber(h.width) ? h.width : 1,
    },
  } as SanityImageSource;
}

export const urlFor = (source: SanityImageSource) =>
  imageBuilder
    .image(normalizeImageSource(source))
    .auto("format")
    .fit("max")
    .format("webp");
