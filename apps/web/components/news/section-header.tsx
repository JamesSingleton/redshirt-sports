import { cn } from "@redshirt-sports/ui/lib/utils";
import { ChevronRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export function SectionHeader({
  id,
  title,
  href,
  linkLabel = "View all",
  badge,
  as: Heading = "h2",
  className,
  children,
}: {
  /** Put on the heading so a wrapping section can use aria-labelledby. */
  id?: string;
  title: ReactNode;
  href?: string;
  linkLabel?: string;
  badge?: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b pb-3",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Heading id={id} className="headline text-2xl">
          {title}
        </Heading>
        {badge ? (
          <span className="bg-brand text-brand-foreground rounded-sm px-2 py-0.5 text-xs font-semibold">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-4">
        {children}
        {href ? (
          <Link
            href={href as Route}
            className="text-primary flex shrink-0 items-center gap-0.5 text-sm font-semibold hover:underline hover:underline-offset-4"
          >
            {linkLabel}
            <span className="sr-only"> from {title}</span>
            <ChevronRightIcon aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
