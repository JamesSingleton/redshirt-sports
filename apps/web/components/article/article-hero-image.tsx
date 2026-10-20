import CustomImage, { IMAGE_SIZES } from "@/components/sanity-image";

/** Featured image on the `ph-photo` surface with credit caption. */
export function ArticleHeroImage({
  image,
  credit,
}: {
  image: unknown;
  credit?: string | null;
}) {
  return (
    <figure className="mt-6">
      <div className="ph-photo relative aspect-video overflow-hidden rounded-xl">
        <CustomImage
          image={image as Parameters<typeof CustomImage>[0]["image"]}
          width={1200}
          height={675}
          className="absolute inset-0 size-full object-cover"
          priority
          mode="cover"
          sizes={IMAGE_SIZES.articleHero}
        />
      </div>
      {credit ? (
        <figcaption className="text-muted-foreground mt-2 text-xs">
          Photo: {credit}
        </figcaption>
      ) : null}
    </figure>
  );
}
