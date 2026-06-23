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
};

function ImageWrapper(props: WrapperProps<"img">) {
  return <BaseSanityImage baseUrl={SANITY_BASE_URL} {...props} />;
}

export function SanityImage({
  image,
  quality = 75,
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
        loading={loading}
        sizes={sizes}
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
      width={width}
      height={height}
      className={className}
      loading={loading}
      sizes={sizes}
      {...processedImageData}
      alt={alt ?? processedImageData.alt}
      queryParams={{ ...queryParams, q: quality }}
    />
  );
}

export default SanityImage;
