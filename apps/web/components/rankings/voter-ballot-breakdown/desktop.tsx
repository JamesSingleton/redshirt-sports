"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@redshirt-sports/ui/components/table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import * as React from "react";

import type { Voter } from "@/types/votes";
import { TeamLogo } from "./team-logo";

type Props = {
  rows: Voter[];
  page: number;
  pageCount: number;
  onFirstAction: () => void;
  onPrevAction: () => void;
  onNextAction: () => void;
  onLastAction: () => void;
};

export default function VoterBreakdownDesktop({
  rows,
  page,
  pageCount,
  onFirstAction,
  onPrevAction,
  onNextAction,
  onLastAction,
}: Props) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    <div className="hidden md:block">
      <div className="relative">
        <div ref={scrollRef} className="relative overflow-x-auto rounded-md">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="bg-background sticky left-0 z-20">
                  Voter
                </TableHead>
                {Array.from({ length: 25 }, (_, i) => i + 1).map((rank) => (
                  <TableHead
                    key={`rank-${rank}`}
                    className="min-w-12 text-center"
                  >
                    {rank}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((voter) => (
                <TableRow key={voter.name}>
                  <TableCell className="bg-background sticky left-0 z-10 min-w-48">
                    <div className="font-medium">{voter.name}</div>
                    <div className="text-muted-foreground text-sm italic">
                      {voter.organization}
                      {voter.organizationRole
                        ? ` (${voter.organizationRole})`
                        : ""}
                    </div>
                  </TableCell>
                  {Array.from({ length: 25 }, (_, i) => i + 1).map((rank) => {
                    const vote = voter.ballot?.[rank - 1];
                    return (
                      <TableCell key={`ballot-rank-${rank}`} className="py-1">
                        <div className="flex items-center justify-center">
                          {vote ? (
                            <TeamLogo vote={vote} size={40} />
                          ) : (
                            <div className="bg-muted/30 h-10 w-10 rounded-sm" />
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="icon"
          className="hidden size-8 bg-transparent lg:flex"
          onClick={onFirstAction}
          disabled={page === 1}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8 bg-transparent"
          onClick={onPrevAction}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="w-[120px] text-center text-sm">
          Page {page} of {pageCount}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="size-8 bg-transparent"
          onClick={onNextAction}
          disabled={page === pageCount}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="hidden size-8 bg-transparent lg:flex"
          onClick={onLastAction}
          disabled={page === pageCount}
          aria-label="Go to last page"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
