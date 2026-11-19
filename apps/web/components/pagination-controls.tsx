"use client";

import {
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
  PaginationNext,
  PaginationPrevious,
} from "@redshirt-sports/ui/components/pagination";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { type ComponentProps, useState } from "react";

import { perPage } from "@/lib/constants";

function PageLink({ href, ...props }: ComponentProps<"a">) {
  return href ? <Link href={href} {...props} /> : <a {...props} />;
}

export default function PaginationControls({
  totalPosts,
}: {
  totalPosts: number;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentPage = Number.parseInt(searchParams.get("page") || "1", 10);
  const pageCount = Math.max(1, Math.ceil(totalPosts / perPage));
  // The URL updates only after navigation, so show the chosen page right away
  // and take the URL's page back whenever it changes.
  const [page, setPage] = useState(currentPage);
  const [urlPage, setUrlPage] = useState(currentPage);
  if (urlPage !== currentPage) {
    setUrlPage(currentPage);
    setPage(currentPage);
  }

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <Pagination
      aria-label="Pagination"
      className="mt-12"
      page={page}
      onPageChange={setPage}
      pageCount={pageCount}
      siblings={1}
      getHref={createPageUrl}
    >
      <PaginationList>
        {({ items }) => (
          <>
            <PaginationItem>
              <PaginationPrevious render={PageLink} />
            </PaginationItem>
            {items.map((item, index) => (
              <PaginationItem
                key={typeof item === "number" ? item : `ellipsis-${index}`}
              >
                {typeof item === "number" ? (
                  <PaginationLink page={item} render={PageLink} />
                ) : (
                  <PaginationEllipsis />
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext render={PageLink} />
            </PaginationItem>
          </>
        )}
      </PaginationList>
    </Pagination>
  );
}
