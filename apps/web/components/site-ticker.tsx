import { Pause, SkipBack, SkipForward } from "lucide-react";
import Link from "next/link";

export interface SiteTickerItem {
  href: string;
  label: string;
}

const FALLBACK_ITEMS: SiteTickerItem[] = [
  {
    href: "/college/football/news/fcs",
    label: "FCS football news and analysis",
  },
  {
    href: "/college/football/news/fbs",
    label: "FBS football news and analysis",
  },
  {
    href: "/college/football/news/d2",
    label: "Division II football headlines",
  },
  {
    href: "/college/football/news/d3",
    label: "Division III football headlines",
  },
  { href: "/college/news", label: "Latest college sports stories" },
];

interface SiteTickerProps {
  items?: SiteTickerItem[];
}

export function SiteTicker({ items }: SiteTickerProps) {
  const stories = items && items.length > 0 ? items : FALLBACK_ITEMS;

  return (
    <div className="bg-ink text-ink-foreground">
      <div className="max-w-site mx-auto flex h-9 items-center gap-3 px-4 lg:px-6">
        <span className="kicker bg-primary text-primary-foreground shrink-0 rounded-sm px-2 py-0.5">
          Top 25 &amp; Top Stories
        </span>
        <nav
          aria-label="Top stories"
          className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_1.5rem,black_calc(100%-1.5rem),transparent)]"
        >
          <ul className="flex items-center gap-6 text-xs whitespace-nowrap">
            {stories.map((item) => (
              <li key={`${item.href}-${item.label}`} className="shrink-0">
                <Link
                  href={item.href}
                  prefetch={false}
                  className="text-ink-foreground/80 hover:text-ink-foreground inline-flex items-center gap-2 transition-colors"
                >
                  <span
                    aria-hidden="true"
                    className="bg-primary size-1.5 rounded-full"
                  />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="text-ink-foreground/60 hidden shrink-0 items-center gap-1 md:flex">
          <button
            type="button"
            aria-label="Previous story"
            className="hover:text-ink-foreground rounded p-1 transition-colors"
          >
            <SkipBack className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Pause ticker"
            className="hover:text-ink-foreground rounded p-1 transition-colors"
          >
            <Pause className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Next story"
            className="hover:text-ink-foreground rounded p-1 transition-colors"
          >
            <SkipForward className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
