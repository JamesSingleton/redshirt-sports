import { cn } from "@redshirt-sports/ui/lib/utils";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { DropdownNavConfig, NavLink, SportNavConfig } from "./nav-config";
import { resolveSportRankings } from "./nav-config";
import type { Top25RankingsData } from "./nav-types";

const darkDropdownPanelClass =
  "min-w-[220px] bg-brand-surface p-0 text-brand-surface-foreground shadow-xl";

const darkDropdownLinkClass =
  "block rounded-none px-4 py-2.5 text-sm text-brand-surface-foreground/80 transition-colors hover:bg-white/15 hover:text-brand-surface-foreground focus-visible:bg-white/15 focus-visible:text-brand-surface-foreground focus-visible:outline-2 focus-visible:outline-primary";

const darkDropdownGroupLabelClass =
  "px-4 pt-2.5 pb-1 text-[11px] font-bold tracking-wider text-brand-surface-muted uppercase";

interface SportDropdownPanelProps {
  config: SportNavConfig;
  latestRankings: Top25RankingsData;
  className?: string;
}

export function SportDropdownPanel({
  config,
  latestRankings,
  className,
}: SportDropdownPanelProps) {
  const rankings = resolveSportRankings(config, latestRankings);

  return (
    <div className={cn(darkDropdownPanelClass, className)} role="menu">
      <p className={darkDropdownGroupLabelClass}>Browse by Division</p>
      <Link
        href={config.allNewsHref}
        className={darkDropdownLinkClass}
        role="menuitem"
      >
        All {config.label} News
      </Link>
      {config.divisions.map((division) => (
        <Link
          key={division.href}
          href={division.href}
          className={darkDropdownLinkClass}
          role="menuitem"
        >
          {division.label}
        </Link>
      ))}
      {rankings.length > 0 && (
        <>
          <p className={darkDropdownGroupLabelClass}>Top 25 Rankings</p>
          {rankings.map((ranking) => (
            <Link
              key={ranking.href}
              href={ranking.href}
              className={darkDropdownLinkClass}
              role="menuitem"
            >
              {ranking.label}
            </Link>
          ))}
        </>
      )}
    </div>
  );
}

interface SimpleDropdownPanelProps {
  config: DropdownNavConfig;
  className?: string;
}

export function SimpleDropdownPanel({
  config,
  className,
}: SimpleDropdownPanelProps) {
  return (
    <div
      className={cn(darkDropdownPanelClass, className)}
      role="menu"
      aria-label={`${config.label} navigation`}
    >
      {config.items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={darkDropdownLinkClass}
          role="menuitem"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

interface MobileNavSectionProps {
  title: string;
  links: NavLink[];
  onNavigate: () => void;
}

export function MobileNavSection({
  title,
  links,
  onNavigate,
}: MobileNavSectionProps) {
  const [open, setOpen] = useState(false);
  const sectionId = `mobile-nav-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  if (links.length === 1) {
    const singleLink = links[0];
    if (!singleLink) {
      return null;
    }

    return (
      <div className="border-brand-surface-border border-b px-4 py-3">
        <p className="text-brand-surface-muted mb-2 text-[11px] font-semibold tracking-wider uppercase">
          {title}
        </p>
        <Link
          href={singleLink.href}
          className="block py-2 text-[15px] transition-colors hover:text-primary"
          onClick={onNavigate}
          prefetch={false}
        >
          {singleLink.label}
        </Link>
      </div>
    );
  }

  return (
    <div className="border-brand-surface-border border-b px-4 py-3">
      <button
        type="button"
        id={sectionId}
        aria-expanded={open}
        aria-controls={`${sectionId}-panel`}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-1"
      >
        <span className="text-brand-surface-muted text-[11px] font-semibold tracking-wider uppercase">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "text-brand-surface-muted size-4 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      <div
        id={`${sectionId}-panel`}
        role="region"
        aria-labelledby={sectionId}
        hidden={!open}
        className="mt-1"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block py-2 pl-1 text-[15px] transition-colors hover:text-primary"
            onClick={onNavigate}
            prefetch={false}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
