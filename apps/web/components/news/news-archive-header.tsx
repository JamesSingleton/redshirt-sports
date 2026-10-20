import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { BreadcrumbProps } from "@/types";

export function NewsArchiveHeader({
  breadcrumbs,
  title,
  description,
}: {
  breadcrumbs: BreadcrumbProps;
  title: string;
  description: string;
}) {
  const items = breadcrumbs.filter(Boolean);

  return (
    <div className="border-b pb-5 pt-5">
      <nav
        className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
        aria-label="Breadcrumb"
      >
        {items.map((item, index) => (
          <span key={item.href} className="inline-flex items-center gap-1">
            {index > 0 ? (
              <ChevronRight className="size-3 shrink-0" aria-hidden />
            ) : null}
            {index === items.length - 1 ? (
              <span className="text-foreground">{item.title}</span>
            ) : (
              <Link href={item.href} className="hover:text-foreground" prefetch={false}>
                {item.title}
              </Link>
            )}
          </span>
        ))}
      </nav>
      <div className="mt-3">
        <div className="kicker text-primary">Archive</div>
        <h1 className="font-display text-[2.4rem] font-extrabold uppercase leading-none lg:text-headline-lg">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
