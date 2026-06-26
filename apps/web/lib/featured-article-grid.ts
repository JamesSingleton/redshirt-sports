import { cn } from "@redshirt-sports/ui/lib/utils";

/** Responsive grid columns that match how many featured cards are actually shown. */
export function featuredArticleGridClass(
  articleCount: number,
  maxColumns: 2 | 3,
): string {
  const columns = Math.min(Math.max(articleCount, 1), maxColumns);

  return cn(
    "grid grid-cols-1 gap-6",
    columns === 1 && "md:grid-cols-1",
    columns === 2 && "md:grid-cols-2",
    columns >= 3 && "md:grid-cols-3",
  );
}
