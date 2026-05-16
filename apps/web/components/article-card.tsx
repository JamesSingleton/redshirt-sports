import type { Slug } from "@redshirt-sports/sanity/types";
import { Separator } from "@redshirt-sports/ui/components/separator";
import Link from "next/link";

import { DivisionBadge, type DivisionSlug } from "@/components/division-badge";
import FormatDate from "@/components/format-date";
import CustomImage from "./sanity-image";

export default function ArticleCard({
  title,
  image,
  imagePriority = false,
  slug,
  author,
  date,
  headingLevel = "h3",
  division,
}: {
  title: string;
  image: any;
  imagePriority?: boolean;
  slug: Slug | string;
  author: string;
  date?: string | null;
  headingLevel?: "h2" | "h3" | "h4";
  division?: DivisionSlug | string;
}) {
  const Heading = headingLevel;

  return (
    <article className="group">
      <div className="relative overflow-hidden">
        <CustomImage
          image={image}
          width={600}
          height={400}
          className="aspect-[3/2] w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          loading={imagePriority ? "eager" : "lazy"}
        />
        {division && (
          <div className="absolute top-0 left-0">
            <DivisionBadge division={division} size="sm" />
          </div>
        )}
      </div>
      <div className="pt-4">
        <Heading className="text-base font-bold leading-snug tracking-tight">
          <Link
            href={`/${slug}`}
            className="hover:text-primary transition-colors"
            prefetch={false}
          >
            {title}
          </Link>
        </Heading>
        <div className="mt-2 flex items-center text-xs text-muted-foreground">
          <span className="font-semibold">{author}</span>
          {date && (
            <>
              <Separator orientation="vertical" className="mx-2 h-3" />
              <FormatDate dateString={date} />
            </>
          )}
        </div>
      </div>
    </article>
  );
}
