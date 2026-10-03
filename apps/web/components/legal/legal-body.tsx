import { cn } from "@redshirt-sports/ui/lib/utils";
import {
  PortableText,
  type PortableTextBlock,
  type PortableTextComponentProps,
  type PortableTextReactComponents,
} from "next-sanity";

import { richTextComponents } from "@/components/rich-text";
import { headingSlug } from "./headings";

type HeadingProps = PortableTextComponentProps<PortableTextBlock>;

const components: Partial<PortableTextReactComponents> = {
  ...richTextComponents,
  block: {
    h2: ({ children, value }: HeadingProps) => (
      <h2 id={headingSlug(value)}>{children}</h2>
    ),
    h3: ({ children, value }: HeadingProps) => (
      <h3 id={headingSlug(value)}>{children}</h3>
    ),
    h4: ({ children }: HeadingProps) => <h4>{children}</h4>,
  },
};

export function LegalBody({
  body,
  className,
}: {
  body: PortableTextBlock[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-zinc dark:prose-invert md:prose-lg max-w-none",
        "prose-headings:scroll-mt-28 prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h2:mt-14 prose-h2:border-t prose-h2:pt-10 prose-h2:text-2xl md:prose-h2:text-3xl",
        "prose-h3:text-xl md:prose-h3:text-2xl prose-h4:text-lg",
        "[&>h2:first-child]:mt-0 [&>h2:first-child]:border-t-0 [&>h2:first-child]:pt-0",
        "prose-a:font-medium prose-a:underline-offset-4 prose-a:decoration-muted-foreground/50 hover:prose-a:decoration-foreground",
        "prose-li:my-1.5 prose-li:marker:text-muted-foreground",
        className,
      )}
    >
      <PortableText value={body} components={components} />
    </div>
  );
}
