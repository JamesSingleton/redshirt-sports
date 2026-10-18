import { AdSlot } from "@/components/ad-slot";
import { BracketPromoCard } from "@/components/sidebar/bracket-promo-card";
import { NewsletterCard } from "@/components/sidebar/newsletter-card";
import { RankingsAside } from "@/components/sidebar/rankings-aside";
import type { SportParam } from "@/utils/espn";

/** Right rail for news list pages: poll, bracket promo, ad and newsletter. */
export function NewsAside({
  sport,
  rankingsDivision,
}: {
  sport: string;
  /** Poll slug (e.g. `fcs`). Omit to hide the rankings card. */
  rankingsDivision?: string;
}) {
  const isFootball = sport === "football";

  return (
    <aside className="grid content-start gap-6" aria-label="Sidebar">
      {rankingsDivision ? (
        <RankingsAside
          sport={sport as SportParam}
          division={rankingsDivision}
          limit={10}
        />
      ) : null}
      {isFootball ? <BracketPromoCard /> : null}
      <AdSlot size="rectangle" />
      <NewsletterCard />
    </aside>
  );
}
