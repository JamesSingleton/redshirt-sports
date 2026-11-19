"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import {
  Menu,
  MenuContent,
  MenuGroupLabel,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@redshirt-sports/ui/components/menu";
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
    <MenuItem
      render={
        <a href={href} download className="flex flex-col items-start gap-0.5" />
      }
    >
      <span className="font-medium">{title}</span>
      <span className="text-muted-foreground text-xs">{detail}</span>
    </MenuItem>
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
    <Menu>
      <MenuTrigger render={<Button variant="outline" size="sm" />}>
        <Download className="size-4" />
        Download
        <ChevronDown className="size-4" />
      </MenuTrigger>
      <MenuContent align="end" className="w-64">
        <MenuGroupLabel>{weekLabel}</MenuGroupLabel>
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
        <MenuSeparator />
        <MenuGroupLabel>{year} season</MenuGroupLabel>
        <Item
          href={seasonHref}
          title="Excel workbook"
          detail="One sheet per week, plus column notes"
        />
      </MenuContent>
    </Menu>
  );
}
