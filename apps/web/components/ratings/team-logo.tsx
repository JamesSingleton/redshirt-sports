import CustomImage from "@/components/sanity-image";

/**
 * School logo for ratings pages. Requested at 2x so it stays sharp on retina
 * screens. In dark mode a thin light outline traces the logo, so navy and black
 * logos keep their edge without washing out the light ones.
 */
export function TeamLogo({
  image,
  name,
  abbreviation,
  size = "sm",
}: {
  image: unknown;
  name: string;
  abbreviation?: string | null;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "size-8" : "size-12";
  const pixels = size === "sm" ? 64 : 96;
  return (
    <span className={`${box} inline-flex shrink-0 items-center justify-center`}>
      {image ? (
        <CustomImage
          image={image as Parameters<typeof CustomImage>[0]["image"]}
          width={pixels}
          height={pixels}
          sizes={`${pixels / 2}px`}
          mode="contain"
          className="size-full object-contain dark:drop-shadow-[0_0_1px_rgb(255_255_255/0.85)]"
          alt={`${name} logo`}
        />
      ) : (
        <span
          aria-hidden
          className="text-muted-foreground font-display bg-muted flex size-full items-center justify-center rounded-full text-[0.6rem] font-bold tracking-wide"
        >
          {(abbreviation ?? name).slice(0, 4).toUpperCase()}
        </span>
      )}
    </span>
  );
}
