import { pageHref } from "@redshirt-sports/seo/urls";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@redshirt-sports/ui/components/pagination";

export function ArchivePagination({
  pathname,
  page,
  pageCount,
}: {
  pathname: string;
  page: number;
  pageCount: number;
}) {
  return (
    <Pagination>
      <PaginationContent>
        {Array.from({ length: pageCount }, (_, index) => {
          const number = index + 1;
          return (
            <PaginationItem key={number}>
              <PaginationLink
                href={pageHref(pathname, number)}
                isActive={number === page}
              >
                {number}
              </PaginationLink>
            </PaginationItem>
          );
        })}
      </PaginationContent>
    </Pagination>
  );
}
