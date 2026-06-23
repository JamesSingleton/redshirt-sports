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
} as const;

type CustomSanityImageProps = SanityImageProps & {
  quality?: number;
  priority?: boolean;
};

function ImageWrapper(props: WrapperProps<"img">) {
  return <BaseSanityImage baseUrl={SANITY_BASE_URL} {...props} />;
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
        loading={priority ? "eager" : loading}
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

  return (
    <ImageWrapper
      {...props}
      width={width ?? processedImageData.width}
      height={height ?? processedImageData.height}
      className={className}
      loading={priority ? "eager" : loading}
      fetchPriority={priority ? "high" : undefined}
      sizes={sizes}
      {...processedImageData}
      alt={resolvedAlt}
      queryParams={{ ...queryParams, q: quality }}
    />
  );
}

export default SanityImage;
