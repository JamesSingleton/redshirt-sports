import { cn } from "@redshirt-sports/ui/lib/utils";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { ResolvedNavbarColumn } from "@/lib/nav-data";
import type { NavLink } from "@/lib/nav-rankings";

const darkDropdownPanelClass =
  "min-w-[220px] bg-brand-surface p-0 text-brand-surface-foreground shadow-xl";

const darkDropdownLinkClass =
  "block rounded-none px-4 py-2.5 text-sm text-brand-surface-foreground/80 transition-colors hover:bg-white/15 hover:text-brand-surface-foreground focus-visible:bg-white/15 focus-visible:text-brand-surface-foreground focus-visible:outline-2 focus-visible:outline-primary";

const darkDropdownGroupLabelClass =
  "px-4 pt-2.5 pb-1 text-[11px] font-bold tracking-wider text-brand-surface-muted uppercase";

interface CmsNavColumnPanelProps {
  column: ResolvedNavbarColumn;
  className?: string;
}

export function CmsNavColumnPanel({
  column,
  className,
}: CmsNavColumnPanelProps) {
  return (
    <div
      className={cn(darkDropdownPanelClass, className)}
      role="menu"
      aria-label={`${column.title} navigation`}
    >
      {column.sections.map((section) => (
        <div key={section._key}>
          {section.groupLabel ? (
            <p className={darkDropdownGroupLabelClass}>{section.groupLabel}</p>
          ) : null}
          {section.links.map((link) => (
            <NavDropdownLink key={link.href} link={link} />
          ))}
        </div>
      ))}
    </div>
  );
}

function NavDropdownLink({ link }: { link: NavLink }) {
  return (
    <Link
      href={link.href}
      className={darkDropdownLinkClass}
      role="menuitem"
      target={link.openInNewTab ? "_blank" : undefined}
      rel={link.openInNewTab ? "noopener noreferrer" : undefined}
    >
      <span>{link.label}</span>
      {link.description ? (
        <span className="mt-0.5 block text-xs text-brand-surface-muted">
          {link.description}
        </span>
      ) : null}
    </Link>
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
          target={singleLink.openInNewTab ? "_blank" : undefined}
          rel={singleLink.openInNewTab ? "noopener noreferrer" : undefined}
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
            target={link.openInNewTab ? "_blank" : undefined}
            rel={link.openInNewTab ? "noopener noreferrer" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
