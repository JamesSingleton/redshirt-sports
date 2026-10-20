import { AdSlot } from "@/components/ad-slot";
import { BracketPromoCard } from "@/components/sidebar/bracket-promo-card";
import { NewsletterCard } from "@/components/sidebar/newsletter-card";
import { RankingsAside } from "@/components/sidebar/rankings-aside";

/** Home right rail: poll, bracket promo, 300×250 ad and newsletter. */
export function HomeAside() {
  return (
    <aside className="grid content-start gap-6" aria-label="Sidebar">
      <RankingsAside sport="football" division="fcs" limit={10} />
      <BracketPromoCard />
      <AdSlot size="rectangle" />
      <NewsletterCard />
    </aside>
  );
}
