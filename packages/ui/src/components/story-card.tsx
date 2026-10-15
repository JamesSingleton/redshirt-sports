import { cn } from "@redshirt-sports/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const storyCardVariants = cva("group flex gap-3", {
  variants: {
    variant: {
      lead: "flex-col gap-4",
      secondary: "flex-col",
      river: "flex-row",
      compact: "flex-row items-center",
    },
  },
  defaultVariants: { variant: "river" },
});

const titleVariants = cva("font-display font-bold tracking-tight", {
  variants: {
    variant: {
      lead: "text-headline-lg",
      secondary: "text-headline",
      river: "text-headline-sm",
      compact: "text-base",
    },
  },
  defaultVariants: { variant: "river" },
});

export function StoryCard({
  href,
  kicker,
  title,
  dek,
  variant = "river",
  className,
}: {
  href: string;
  kicker?: string;
  title: string;
  dek?: string;
  className?: string;
} & VariantProps<typeof storyCardVariants>) {
  return (
    <article className={cn(storyCardVariants({ variant }), className)}>
      <div className="ph-photo aspect-video w-full shrink-0 rounded-md" />
      <div className="min-w-0">
        {kicker ? <p className="kicker text-primary">{kicker}</p> : null}
        <h2 className={titleVariants({ variant })}>
          <a href={href}>{title}</a>
        </h2>
        {dek && variant !== "compact" ? (
          <p className="mt-1 text-muted-foreground text-sm">{dek}</p>
        ) : null}
      </div>
    </article>
  );
}
