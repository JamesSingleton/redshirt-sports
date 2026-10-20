import { Badge } from "@redshirt-sports/ui/components/badge";
import Link from "next/link";

export type ArticleTagLink = { label: string; href?: string };

/** Conference links and topic tags as secondary badges. */
export function ArticleTags({ tags }: { tags: ArticleTagLink[] }) {
  if (tags.length === 0) return null;

  return (
    <ul className="not-prose mt-6 flex flex-wrap gap-2" aria-label="Tags">
      {tags.map((tag) => (
        <li key={`${tag.label}-${tag.href ?? ""}`}>
          {tag.href ? (
            <Badge asChild variant="secondary">
              <Link href={tag.href} prefetch={false}>
                {tag.label}
              </Link>
            </Badge>
          ) : (
            <Badge variant="secondary">{tag.label}</Badge>
          )}
        </li>
      ))}
    </ul>
  );
}
