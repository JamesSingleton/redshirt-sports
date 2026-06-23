import type { WrapperProps } from "sanity-image";

import { dataset, projectId } from "./api";

type SanityImageAssetReference = {
  readonly _ref?: string | null;
  readonly _id?: string | null;
};

export type SanityImageData = {
  readonly id?: string | null;
  readonly _id?: string | null;
  readonly alt?: string | null;
  readonly altText?: string | null;
  readonly caption?: string | null;
  readonly credit?: string | null;
  readonly attribution?: string | null;
  readonly preview?: string | null;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly dominantColor?: string | null;
  readonly asset?: SanityImageAssetReference | null;
  readonly hotspot?: { readonly x: number; readonly y: number } | null;
  readonly crop?: {
    readonly top: number;
    readonly bottom: number;
    readonly left: number;
    readonly right: number;
  } | null;
};

export type SanityImageInput = SanityImageData | string | null | undefined;

type ImageHotspot = {
  readonly x: number;
  readonly y: number;
};

type ImageCrop = {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
};

type ProcessedImageData = {
  readonly id: string;
  readonly alt: string;
  readonly preview?: string;
  readonly width?: number;
  readonly height?: number;
  readonly hotspot?: ImageHotspot;
  readonly crop?: ImageCrop;
};

export type SanityImageProps = {
  readonly image: SanityImageInput;
} & Omit<WrapperProps<"img">, "id">;

export const SANITY_BASE_URL =
  `https://cdn.sanity.io/images/${projectId}/${dataset}/` as const;

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

function isValidHotspot(hotspot: unknown): hotspot is ImageHotspot {
  if (!hotspot || typeof hotspot !== "object") {
    return false;
  }
  const h = hotspot as Record<string, unknown>;
  return isValidNumber(h.x) && isValidNumber(h.y);
}

function isValidCrop(crop: unknown): crop is ImageCrop {
  if (!crop || typeof crop !== "object") {
    return false;
  }
  const c = crop as Record<string, unknown>;
  return (
    isValidNumber(c.top) &&
    isValidNumber(c.bottom) &&
    isValidNumber(c.left) &&
    isValidNumber(c.right)
  );
}

function extractHotspot(image: SanityImageData): ImageHotspot | undefined {
  if (!isValidHotspot(image?.hotspot)) {
    return;
  }
  return {
    x: image.hotspot.x,
    y: image.hotspot.y,
  };
}

function extractCrop(image: SanityImageData): ImageCrop | undefined {
  if (!isValidCrop(image?.crop)) {
    return;
  }
  return {
    top: image.crop.top,
    bottom: image.crop.bottom,
    left: image.crop.left,
    right: image.crop.right,
  };
}

function hasPreview(preview: unknown): preview is string {
  return typeof preview === "string" && preview.length > 0;
}

function extractImageId(image: SanityImageData): string | null {
  if (typeof image.id === "string" && image.id.length > 0) {
    return image.id;
  }

  if (typeof image._id === "string" && image._id.length > 0) {
    return image._id;
  }

  const assetRef = image.asset?._ref ?? image.asset?._id;
  if (typeof assetRef === "string" && assetRef.length > 0) {
    return assetRef;
  }

  return null;
}

function extractAlt(image: SanityImageData): string {
  if (typeof image.alt === "string" && image.alt.length > 0) {
    return image.alt;
  }

  if (typeof image.caption === "string" && image.caption.length > 0) {
    return image.caption;
  }

  if (typeof image.altText === "string" && image.altText.length > 0) {
    return image.altText;
  }

  return "";
}

function extractDimensions(image: SanityImageData): {
  width?: number;
  height?: number;
} {
  const width = isValidNumber(image.width) ? image.width : undefined;
  const height = isValidNumber(image.height) ? image.height : undefined;

  return { width, height };
}

export function processImageData(
  image: SanityImageInput,
): ProcessedImageData | null {
  if (!image || typeof image !== "object") {
    return null;
  }

  const id = extractImageId(image);

  if (!id) {
    return null;
  }

  const hotspot = extractHotspot(image);
  const crop = extractCrop(image);
  const preview = hasPreview(image.preview) ? image.preview : undefined;
  const { width, height } = extractDimensions(image);

  return {
    id,
    alt: extractAlt(image),
    ...(preview && { preview }),
    ...(width && { width }),
    ...(height && { height }),
    ...(hotspot && { hotspot }),
    ...(crop && { crop }),
  };
}
