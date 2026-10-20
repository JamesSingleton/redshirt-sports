import { buttonVariants } from "@redshirt-sports/ui/components/button";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export const BRACKET_CHALLENGE_HREF = "/college/football/bracket-challenge/fcs";

/** Ink promo card for the FCS Bracket Challenge. */
export function BracketPromoCard({ className }: { className?: string }) {
  return (
    <section
      aria-labelledby="bracket-promo-heading"
      className={cn(
        "bg-ink text-ink-foreground relative overflow-hidden rounded-xl border p-5",
        className,
      )}
    >
      <div className="bg-primary/30 absolute -top-8 -right-8 size-40 rounded-full blur-2xl" />
      <div className="relative">
        <div className="kicker text-primary">Bracket Challenge</div>
        <h2
          id="bracket-promo-heading"
          className="font-display mt-1 text-3xl leading-none font-extrabold uppercase"
        >
          FCS Playoffs
        </h2>
        <p className="text-ink-foreground/75 mt-2 text-sm">
          Pick every game, create a group for your friends and see who survives
          the bracket.
        </p>
        <div className="mt-4 flex gap-2">
          <Link
            href={BRACKET_CHALLENGE_HREF}
            prefetch={false}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Make your picks
            <ChevronRight aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
