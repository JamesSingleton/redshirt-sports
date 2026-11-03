import Link from "next/link";

import { PlayoffBracket } from "@/components/bracket/playoff-bracket";
import {
  bracketEditionLabel,
  bracketEditionPath,
  getCachedPublishedBracket,
} from "@/lib/bracket-data";

/**
 * An article's `bracketEmbed` block. Renders nothing for a draft or a deleted
 * edition, so an unpublished bracket never leaks into a live story.
 */
export async function BracketEmbed({
  editionId,
  caption,
}: {
  editionId: string;
  caption?: string | null;
}) {
  const published = await getCachedPublishedBracket(editionId);
  if (!published) return null;
  const { edition, view } = published;

  return (
    <figure className="not-prose my-8 flex flex-col gap-2 rounded-lg border border-border p-3">
      <PlayoffBracket view={view} />
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 text-muted-foreground text-sm">
        <span>{caption ?? bracketEditionLabel(edition)}</span>
        <Link
          href={bracketEditionPath(edition)}
          className="font-medium text-foreground underline underline-offset-4"
        >
          View full bracket
        </Link>
      </figcaption>
    </figure>
  );
}
