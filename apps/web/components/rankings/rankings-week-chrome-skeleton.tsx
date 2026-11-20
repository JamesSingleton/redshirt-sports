import { Skeleton } from "@redshirt-sports/ui/components/skeleton";

/**
 * Placeholder text in a skeleton bar. It keeps the real element's font, line
 * height and wrapping, so the bar is exactly as tall as the text it stands in
 * for and the page doesn't move when the text arrives.
 */
function TextBar({ children }: { children: string }) {
  return (
    <span className="animate-pulse rounded-md bg-accent text-transparent motion-reduce:animate-none">
      {children}
    </span>
  );
}

const TAB_LABELS = ["Poll", "Ballots", "Voters", "History", "Methodology"];

/**
 * Stands in for `RankingsDivisionChromeClient` (breadcrumb and section tabs),
 * using the same boxes so the page below starts where it will end up.
 */
export function RankingsDivisionChromeSkeleton() {
  return (
    <div className="pt-5" aria-hidden>
      <div className="flex text-sm">
        <TextBar>College › Football › Rankings › FCS</TextBar>
      </div>
      <div className="mt-5">
        <div className="mt-5 flex min-w-0 max-w-full gap-6 overflow-hidden border-b">
          {TAB_LABELS.map((label) => (
            <span
              key={label}
              className="border-b-2 border-transparent px-1 pt-1 pb-3 text-sm font-semibold whitespace-nowrap"
            >
              <TextBar>{label}</TextBar>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Stands in for `RankingsWeekChromeClient` (kicker, title, methodology link,
 * year and week pickers), using the same boxes.
 */
export function RankingsWeekChromeSkeleton() {
  return (
    <div
      className="mt-3 flex flex-wrap items-end justify-between gap-4"
      aria-busy="true"
    >
      <span className="sr-only" role="status">
        Loading rankings…
      </span>
      <div aria-hidden>
        <div className="kicker">
          <TextBar>Redshirt Sports Poll · FCS</TextBar>
        </div>
        <div className="font-display text-[2.3rem] font-extrabold leading-[1.08] lg:text-headline-lg">
          <TextBar>FCS Top 25 · Week 10</TextBar>
        </div>
        <p className="mt-2 text-sm">
          <TextBar>Methodology</TextBar>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2" aria-hidden>
        <Skeleton className="h-9 w-24 motion-reduce:animate-none" />
        <Skeleton className="h-9 w-28 motion-reduce:animate-none" />
        <Skeleton className="size-9 motion-reduce:animate-none" />
      </div>
    </div>
  );
}
