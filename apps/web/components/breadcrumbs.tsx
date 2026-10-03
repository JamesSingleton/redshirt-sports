import { ChevronRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import type { BreadcrumbProps } from "@/types";

type BreadCrumbPages = {
  breadCrumbPages: BreadcrumbProps;
};

const BreadCrumbs = ({ breadCrumbPages }: BreadCrumbPages) => {
  const pages = breadCrumbPages.filter(
    (page): page is { title: string; href: string } => Boolean(page?.title),
  );

  return (
    <nav aria-label="Breadcrumb">
      <ol className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
        <li>
          <Link
            href="/"
            prefetch={false}
            className="hover:text-foreground transition-colors"
          >
            Home
          </Link>
        </li>
        {pages.map((page, index) => {
          const isCurrent = index === pages.length - 1;
          return (
            <li key={page.href} className="flex items-center gap-1.5">
              <ChevronRight aria-hidden="true" className="size-3.5" />
              {isCurrent ? (
                <span
                  aria-current="page"
                  className="text-foreground font-medium"
                >
                  {page.title}
                </span>
              ) : (
                <Link
                  href={page.href as Route}
                  prefetch={false}
                  className="hover:text-foreground transition-colors"
                >
                  {page.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default BreadCrumbs;
