import { cn } from "@redshirt-sports/ui/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

export type BreadcrumbTrailItem = {
  title?: string | null;
  href?: string | null;
};

/** Small blueprint breadcrumb row (`text-xs`, chevron separators). */
export function BreadcrumbTrail({
  items,
  className,
  includeHome = true,
}: {
  items: BreadcrumbTrailItem[];
  className?: string;
  includeHome?: boolean;
}) {
  const crumbs = items.filter(
    (item): item is { title: string; href?: string | null } =>
      Boolean(item?.title),
  );
  const trail = includeHome
    ? [{ title: "Home", href: "/" as string | null | undefined }, ...crumbs]
    : crumbs;

  return (
    <nav
      aria-label="breadcrumb"
      className={cn("text-muted-foreground text-xs", className)}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;
          return (
            <Fragment key={`${crumb.title}-${index}`}>
              <li className="flex items-center gap-1">
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    prefetch={false}
                    aria-current={isLast ? "page" : undefined}
                    className={cn(
                      "hover:text-foreground",
                      isLast && "text-foreground",
                    )}
                  >
                    {crumb.title}
                  </Link>
                ) : (
                  <span
                    className={cn(isLast && "text-foreground")}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {crumb.title}
                  </span>
                )}
              </li>
              {isLast ? null : (
                <li aria-hidden className="flex items-center">
                  <ChevronRight className="size-3 shrink-0" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
