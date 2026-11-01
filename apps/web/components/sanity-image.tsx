"use client";
import {
  processImageData,
  SANITY_BASE_URL,
  type SanityImageProps,
} from "@redshirt-sports/sanity/image";
import {
  SanityImage as BaseSanityImage,
  type WrapperProps,
} from "sanity-image";

export const IMAGE_SIZES = {
  articleCard:
    "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw",
  articleHero: "(max-width: 1024px) 100vw, min(1200px, 70vw)",
  homeHero: "(max-width: 1024px) 100vw, 66vw",
  articleInline: "(max-width: 1024px) 100vw, min(720px, 70vw)",
  teamFeatured: "(max-width: 768px) 100vw, 50vw",
  teamThumbnail: "180px",
  /** "Articles you might also like" thumbnail: 6rem, 8rem from `sm`. */
  relatedThumb: "(min-width: 640px) 128px, 96px",
  /** School logo chips (e.g. "Schools in this article"). */
  logoChip: "32px",
} as const;

type CustomSanityImageProps = SanityImageProps & {
  quality?: number;
  priority?: boolean;
};

function ImageWrapper(props: WrapperProps<"img">) {
  return <BaseSanityImage baseUrl={SANITY_BASE_URL} {...props} />;
}

/**
 * Render dimensions: explicit props first; a missing side is derived from the
 * asset's aspect ratio; with neither prop, fall back to the asset's size.
 */
export function renderSize(
  width: number | undefined,
  height: number | undefined,
  assetWidth: number | undefined,
  assetHeight: number | undefined,
): { width?: number; height?: number } {
  const ratio =
    assetWidth && assetHeight ? assetHeight / assetWidth : undefined;
  if (width && height) return { width, height };
  if (width) {
    return ratio ? { width, height: Math.round(width * ratio) } : { width };
  }
  if (height) {
    return ratio ? { width: Math.round(height / ratio), height } : { height };
  }
  return {
    ...(assetWidth ? { width: assetWidth } : {}),
    ...(assetHeight ? { height: assetHeight } : {}),
  };
}

function warnMissingAlt(id: string, alt: string) {
  if (process.env.NODE_ENV === "development" && !alt) {
    console.warn(`[SanityImage] Missing alt text for image: ${id}`);
  }
}

export function SanityImage({
  image,
  quality = 75,
  priority = false,
  queryParams,
  alt,
  width,
  height,
  className,
  loading,
  sizes,
  ...props
}: CustomSanityImageProps) {
  if (typeof image === "string") {
    if (!image) {
      return null;
    }

    return (
      <img
        src={image}
        alt={alt ?? ""}
        width={width}
        height={height}
        className={className}
        loading={priority ? "eager" : (loading ?? "lazy")}
        fetchPriority={priority ? "high" : undefined}
        sizes={sizes}
      />
    );
  }

  const processedImageData = processImageData(image);

  if (!processedImageData) {
    return null;
  }

  const resolvedAlt = alt ?? processedImageData.alt;
  warnMissingAlt(processedImageData.id, resolvedAlt);

  const {
    width: assetWidth,
    height: assetHeight,
    ...imageData
  } = processedImageData;

  return (
    <ImageWrapper
      {...props}
      {...imageData}
      // The caller's render size wins over the asset's original dimensions,
      // which would otherwise build a full-size srcset for small images.
      {...renderSize(width, height, assetWidth, assetHeight)}
      className={className}
      // Only pass `loading` when set: an explicit `undefined` overrides
      // sanity-image's `lazy` default and makes every image load eagerly.
      {...(priority
        ? { loading: "eager" as const, fetchPriority: "high" as const }
        : loading
          ? { loading }
          : {})}
      sizes={sizes}
      alt={resolvedAlt}
      queryParams={{ ...queryParams, q: quality }}
    />
  );
}

export default SanityImage;
