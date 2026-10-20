import CustomImage from "@/components/sanity-image";

type TeamMarkProps = {
  image: unknown;
  shortName?: string | null;
  abbreviation?: string | null;
  name?: string | null;
  size?: "sm" | "md";
  schoolLabel?: string;
};

function initialsForTeam(
  abbreviation?: string | null,
  shortName?: string | null,
  name?: string | null,
): string {
  const source = abbreviation ?? shortName ?? name ?? "?";
  return source.slice(0, 4).toUpperCase();
}

export function TeamMark({
  image,
  shortName,
  abbreviation,
  name,
  size = "sm",
  schoolLabel,
}: TeamMarkProps) {
  const dim = size === "sm" ? 28 : 40;
  const label =
    schoolLabel ?? `${shortName ?? name ?? "Team"} logo`;

  if (image) {
    return (
      <CustomImage
        image={image as Parameters<typeof CustomImage>[0]["image"]}
        width={dim}
        height={dim}
        className={
          size === "sm"
            ? "size-7 shrink-0 object-contain"
            : "size-10 shrink-0 object-contain"
        }
        mode="contain"
        alt={label}
      />
    );
  }

  return (
    <span
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 bg-muted font-display text-[0.62em] font-bold tracking-wide text-muted-foreground"
      title={shortName ?? name ?? undefined}
      aria-hidden
    >
      {initialsForTeam(abbreviation, shortName, name)}
    </span>
  );
}
