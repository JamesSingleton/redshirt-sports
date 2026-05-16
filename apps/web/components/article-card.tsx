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
    <div className="group overflow-hidden rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="relative">
        <CustomImage
          image={image}
          width={600}
          height={400}
          className="h-48 w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          loading={imagePriority ? "eager" : "lazy"}
        />
        {division && (
          <div className="absolute top-3 left-3">
            <DivisionBadge division={division} />
          </div>
        )}
      </div>
      <div className="p-4">
        <Heading className="mb-2 text-lg font-bold leading-tight">
          <Link
            href={`/${slug}`}
            className="hover:text-primary transition-colors"
            prefetch={false}
          >
            {title}
          </Link>
        </Heading>
        <div className="text-muted-foreground flex items-center text-sm">
          <span className="font-medium">{author}</span>
          {date && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <FormatDate dateString={date} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
