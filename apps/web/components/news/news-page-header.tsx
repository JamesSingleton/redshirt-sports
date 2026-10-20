import type { ReactNode } from "react";

import { BreadcrumbTrail, type BreadcrumbTrailItem } from "./breadcrumb-trail";

/**
 * Blueprint list-page header: breadcrumbs, kicker and display title on a
 * soft gradient band (news.html / division-news.html).
 */
export function NewsPageHeader({
  title,
  kicker,
  breadcrumbs,
  actions,
}: {
  title: string;
  kicker?: string | null;
  breadcrumbs?: BreadcrumbTrailItem[];
  actions?: ReactNode;
}) {
  return (
    <div className="from-muted/60 to-background border-b bg-gradient-to-b">
      <div className="max-w-site mx-auto px-4 pt-5 pb-6 lg:px-6">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <BreadcrumbTrail items={breadcrumbs} />
        ) : null}
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            {kicker ? (
              <div className="kicker text-primary">{kicker}</div>
            ) : null}
            <h1 className="font-display lg:text-headline-lg text-[2.4rem] leading-none font-extrabold uppercase">
              {title}
            </h1>
          </div>
          {actions}
        </div>
      </div>
    </div>
  );
}
