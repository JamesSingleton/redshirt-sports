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
      {...processedImageData}
      width={width ?? processedImageData.width}
      height={height ?? processedImageData.height}
      className={className}
      loading={priority ? "eager" : loading}
      fetchPriority={priority ? "high" : undefined}
      sizes={sizes}
      alt={resolvedAlt}
      queryParams={{ ...queryParams, q: quality }}
    />
  );
}

export default SanityImage;
