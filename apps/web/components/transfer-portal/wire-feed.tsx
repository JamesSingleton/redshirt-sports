"use client";

import type { PortalEntry } from "@redshirt-sports/db/queries";
import { Button } from "@redshirt-sports/ui/components/button";
import { Spinner } from "@redshirt-sports/ui/components/spinner";
import { TableBody } from "@redshirt-sports/ui/components/table";
import { useState, useTransition, ViewTransition } from "react";

import {
  type LoadMorePortalInput,
  loadMorePortalEntries,
} from "@/actions/transfer-portal";
import {
  PortalEntriesTable,
  PortalEntryRow,
} from "@/components/transfer-portal/portal-entries-table";

type Page = { cursor: string; entries: PortalEntry[] };

/** Parent should key this by the active filters so pages reset on change. */
export function WireFeed({
  query,
  caption,
  initialEntries,
  initialCursor,
}: {
  query: Omit<LoadMorePortalInput, "cursor">;
  caption: string;
  initialEntries: PortalEntry[];
  initialCursor: string | null;
}) {
  const [pages, setPages] = useState<Page[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [failed, setFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    if (!cursor) return;
    setFailed(false);
    startTransition(async () => {
      try {
        const next = await loadMorePortalEntries({ ...query, cursor });
        startTransition(() => {
          setPages((current) => [
            ...current,
            { cursor, entries: next.entries },
          ]);
          setCursor(next.nextCursor);
        });
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full">
        <PortalEntriesTable caption={caption}>
          <TableBody>
            {initialEntries.map((entry) => (
              <PortalEntryRow key={entry.id} entry={entry} />
            ))}
          </TableBody>
          {pages.map((page) => (
            <ViewTransition key={page.cursor} enter="slide-up" default="none">
              <TableBody>
                {page.entries.map((entry) => (
                  <PortalEntryRow key={entry.id} entry={entry} />
                ))}
              </TableBody>
            </ViewTransition>
          ))}
        </PortalEntriesTable>
      </div>
      {failed ? (
        <p role="alert" className="text-destructive text-sm">
          Could not load more entries. Try again.
        </p>
      ) : null}
      {cursor ? (
        <Button variant="outline" onClick={loadMore} disabled={isPending}>
          {isPending ? <Spinner /> : null}
          Load more
        </Button>
      ) : null}
    </div>
  );
}
