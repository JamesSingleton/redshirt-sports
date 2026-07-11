"use client";

import {
  processImageData,
  SANITY_BASE_URL,
  type SanityImageProps as SharedSanityImageProps,
} from "@redshirt-sports/sanity/image";
import type { ElementType } from "react";
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

export type SanityImageProps = SharedSanityImageProps & {
  quality?: number;
  priority?: boolean;
};

const ImageWrapper = <T extends ElementType = "img">(
  props: WrapperProps<T>,
) => <BaseSanityImage baseUrl={SANITY_BASE_URL} {...props} />;

export function SanityImage({
  image,
  quality,
  priority = false,
  queryParams,
  loading,
  alt,
  ...props
}: SanityImageProps) {
  if (typeof image === "string") {
    if (!image) {
      return null;
    }

    const { mode: _mode, ...imgProps } = props;

    return (
      <img
        {...imgProps}
        src={image}
        alt={alt ?? ""}
        loading={priority ? "eager" : (loading ?? "lazy")}
        fetchPriority={priority ? "high" : undefined}
      />
    );
  }

  const processedImageData = processImageData(image);

  if (!processedImageData) {
    return null;
  }

  return (
    <ImageWrapper
      {...props}
      id={processedImageData.id}
      alt={alt ?? processedImageData.alt}
      {...(processedImageData.preview && {
        preview: processedImageData.preview,
      })}
      {...(processedImageData.hotspot && {
        hotspot: processedImageData.hotspot,
      })}
      {...(processedImageData.crop && { crop: processedImageData.crop })}
      loading={priority ? "eager" : loading}
      queryParams={{
        ...queryParams,
        ...(quality != null ? { q: quality } : {}),
      }}
    />
  );
}

export default SanityImage;
