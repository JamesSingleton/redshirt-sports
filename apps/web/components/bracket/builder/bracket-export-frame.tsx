import type { BracketView } from "@redshirt-sports/db/playoff-bracket";

import { PlayoffBracket } from "@/components/bracket/playoff-bracket";
import CustomImage from "@/components/sanity-image";

type LogoImage = Parameters<typeof CustomImage>[0]["image"];

/**
 * The bracket as it leaves the site: saved as an image or printed. Always in
 * the light theme and always under the Redshirt Sports logo. It sits off
 * screen until it is captured, and is the only thing on the page in print.
 * `blank` leaves every undecided row empty, to fill in by hand.
 */
export function BracketExportFrame({
  view,
  title,
  subtitle,
  blank,
  logo,
  ref,
}: {
  view: BracketView;
  title: string;
  subtitle: string;
  blank: boolean;
  /** The site wordmark for light backgrounds, from the site settings. */
  logo: LogoImage;
  ref: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      aria-hidden
      inert
      className="pointer-events-none fixed top-0 -left-[100000px] print:static"
    >
      <div
        ref={ref}
        data-print-frame
        className="light flex w-max flex-col gap-6 bg-background p-8 text-foreground print:p-0 print:[zoom:var(--bracket-print-zoom,0.5)]"
      >
        <div className="flex items-center justify-between gap-8">
          {logo ? (
            <CustomImage
              image={logo}
              alt="Redshirt Sports"
              height={44}
              className="h-11 w-auto"
              loading="eager"
              crossOrigin="anonymous"
              quality={100}
            />
          ) : (
            <span className="font-display text-2xl font-bold tracking-tight">
              Redshirt Sports
            </span>
          )}
          <div className="text-right">
            <p className="font-display text-2xl font-bold tracking-tight">
              {title}
            </p>
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          </div>
        </div>
        <PlayoffBracket
          view={view}
          plain
          tightSeeds
          className="overflow-visible pb-0 [--bracket-card:12.5rem]"
          renderEmpty={
            blank
              ? (side) => (
                  <span className="flex items-center px-2 text-muted-foreground text-xs tabular-nums">
                    {side.showSeed ? side.seed : null}
                  </span>
                )
              : undefined
          }
        />
        <p className="text-muted-foreground text-xs">
          Make your own at redshirtsports.com
        </p>
      </div>
    </div>
  );
}
