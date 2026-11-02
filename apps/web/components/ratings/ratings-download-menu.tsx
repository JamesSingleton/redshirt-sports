"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@redshirt-sports/ui/components/dropdown-menu";
import { ChevronDown, Download } from "lucide-react";

function Item({
  href,
  title,
  detail,
}: {
  href: string;
  title: string;
  detail: string;
}) {
  return (
    <DropdownMenuItem asChild>
      <a href={href} download className="flex flex-col items-start gap-0.5">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground text-xs">{detail}</span>
      </a>
    </DropdownMenuItem>
  );
}

/** One "Download" button: this week as CSV or JSON, or the whole season as Excel. */
export function RatingsDownloadMenu({
  weekLabel,
  year,
  csvHref,
  jsonHref,
  seasonHref,
}: {
  /** "2026 Week 9" */
  weekLabel: string;
  year: number;
  csvHref: string;
  jsonHref: string;
  seasonHref: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="size-4" />
          Download
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>{weekLabel}</DropdownMenuLabel>
        <Item
          href={csvHref}
          title="CSV"
          detail="Opens in Excel, Numbers, or Sheets"
        />
        <Item
          href={jsonHref}
          title="JSON"
          detail="Every number plus each team's games"
        />
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{year} season</DropdownMenuLabel>
        <Item
          href={seasonHref}
          title="Excel workbook"
          detail="One sheet per week, plus column notes"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
