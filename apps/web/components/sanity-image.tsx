import { SanityImage } from "sanity-image"
import { getImageDimensions } from "@sanity/asset-utils";

import { projectId, dataset } from "@/lib/sanity/api"

type CustomImageProps = {
  image: any
  width?: number
  height?: number
  className?: string
  loading?: "lazy" | "eager"
  mode?: "cover" | "contain"
  quality?: number
}

const CustomImage = ({image, width, height, className, loading, mode="contain", quality = 75}: CustomImageProps) => {
  const dimensions = getImageDimensions(image.asset);
  return (
    <SanityImage
      id={image.asset._ref}
      projectId={projectId}
      dataset={dataset}
      hotspot={image.hotspot}
      crop={image.crop}
      width={dimensions.width ?? width}
      height={dimensions.height ?? height}
      className={className}
      alt={image.alt}
      loading={loading}
      mode={mode}
      sizes="(max-width: 640px) 75vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
      queryParams={{
        q: quality,
      }}
    />
  )
}

export default CustomImage