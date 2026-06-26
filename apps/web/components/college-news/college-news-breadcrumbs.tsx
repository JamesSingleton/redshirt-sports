import Link from "next/link";

export type CollegeNewsBreadcrumb = {
  label: string;
  href?: string;
};

interface CollegeNewsBreadcrumbsProps {
  items: CollegeNewsBreadcrumb[];
}

export function CollegeNewsBreadcrumbs({ items }: CollegeNewsBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 border-border border-b pb-3">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <li>
          <Link
            href="/"
            prefetch={false}
            className="transition-colors hover:text-primary"
          >
            Home
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-2"
            >
              <span aria-hidden="true">/</span>
              {isLast || !item.href ? (
                <span
                  className="font-medium text-foreground"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  prefetch={false}
                  className="transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
