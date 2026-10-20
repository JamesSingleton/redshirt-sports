import { ChevronRight } from "lucide-react";
import Link from "next/link";

export type SiteBreadcrumbItem = {
  label: string;
  href?: string;
};

export function SiteBreadcrumb({ items }: { items: SiteBreadcrumbItem[] }) {
  return (
    <nav
      className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? (
              <ChevronRight className="size-3 shrink-0" aria-hidden />
            ) : null}
            {isLast || !item.href ? (
              <span className={isLast ? "text-foreground" : undefined}>
                {item.label}
              </span>
            ) : (
              <Link href={item.href} prefetch={false} className="hover:text-foreground">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
