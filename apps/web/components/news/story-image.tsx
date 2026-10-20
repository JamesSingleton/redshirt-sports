import { cn } from "@redshirt-sports/ui/lib/utils";

import CustomImage from "@/components/sanity-image";

/**
 * Story photo with the blueprint `ph-photo` surface behind it. When a post has
 * no usable image, `CustomImage` renders nothing and the placeholder remains.
 */
export function StoryImage({
  image,
  className,
  width = 400,
  height = 300,
  sizes,
  priority = false,
  quality = 70,
}: {
  image: unknown;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  quality?: number;
}) {
  return (
    <div className={cn("ph-photo relative overflow-hidden", className)}>
      <CustomImage
        image={image as Parameters<typeof CustomImage>[0]["image"]}
        width={width}
        height={height}
        className="absolute inset-0 size-full object-cover object-top"
        mode="cover"
        priority={priority}
        quality={quality}
        sizes={sizes}
      />
    </div>
  );
}
