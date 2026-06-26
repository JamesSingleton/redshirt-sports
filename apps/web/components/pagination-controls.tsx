"use client";

import { buttonVariants } from "@redshirt-sports/ui/components/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@redshirt-sports/ui/components/pagination";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { perPage } from "@/lib/constants";

type PageLinkProps = {
  href?: string;
  isActive?: boolean;
  size?: "default" | "icon";
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
  "aria-disabled"?: boolean;
  tabIndex?: number;
};

function PageLink({
  href,
  isActive,
  size = "icon",
  className,
  children,
  "aria-label": ariaLabel,
  "aria-disabled": ariaDisabled,
  tabIndex,
}: PageLinkProps) {
  const classes = cn(
    buttonVariants({
      variant: isActive ? "outline" : "ghost",
      size,
    }),
    className,
  );

  if (!href || ariaDisabled) {
    return (
      <span
        aria-label={ariaLabel}
        aria-current={isActive ? "page" : undefined}
        aria-disabled={ariaDisabled}
        tabIndex={tabIndex}
        className={classes}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      prefetch={false}
      scroll={false}
      aria-label={ariaLabel}
      aria-current={isActive ? "page" : undefined}
      className={classes}
    >
      {children}
    </Link>
  );
}

export default function PaginationControls({
  totalPosts,
}: {
  totalPosts: number;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const totalPages = Math.ceil(totalPosts / perPage);

  const createPageUrl = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams ?? "");
    params.set("page", pageNumber.toString());
    if (pageNumber === 1 || pageNumber === 0) {
      params.delete("page");
    }

    return `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
  };

  const pageNumbers: number[] = [];
  for (let i = currentPage - 1; i <= currentPage + 1; i++) {
    if (i > 0 && i <= totalPages) {
      pageNumbers.push(i);
    }
  }

  const isPreviousDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  const showEllipsis =
    totalPages > 3 && (currentPage < totalPages - 1 || currentPage > 2);

  return (
    <Pagination className="mt-12">
      <PaginationContent>
        <PaginationItem>
          <PageLink
            href={
              isPreviousDisabled ? undefined : createPageUrl(currentPage - 1)
            }
            aria-label="Go to previous page"
            aria-disabled={isPreviousDisabled}
            tabIndex={isPreviousDisabled ? -1 : undefined}
            size="default"
            className={cn(
              "gap-1 px-2.5 sm:pl-2.5",
              isPreviousDisabled && "pointer-events-none opacity-50",
            )}
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:block">Previous</span>
          </PageLink>
        </PaginationItem>

        {pageNumbers.map((pageNumber) => (
          <PaginationItem key={pageNumber}>
            <PageLink
              href={createPageUrl(pageNumber)}
              isActive={pageNumber === currentPage}
            >
              {pageNumber}
            </PageLink>
          </PaginationItem>
        ))}

        {showEllipsis ? (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        ) : null}

        <PaginationItem>
          <PageLink
            href={isNextDisabled ? undefined : createPageUrl(currentPage + 1)}
            aria-label="Go to next page"
            aria-disabled={isNextDisabled}
            tabIndex={isNextDisabled ? -1 : undefined}
            size="default"
            className={cn(
              "gap-1 px-2.5 sm:pr-2.5",
              isNextDisabled && "pointer-events-none opacity-50",
            )}
          >
            <span className="hidden sm:block">Next</span>
            <ChevronRight className="size-4" />
          </PageLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
