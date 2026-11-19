"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@redshirt-sports/ui/components/sidebar";
import {
  type Icon,
  IconBinaryTree,
  IconChartBar,
  IconChecklist,
  IconDatabase,
  IconHome,
  IconId,
  IconListDetails,
  IconTransfer,
  IconTrophy,
  IconUserShield,
  IconUsers,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import type * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import type { Area } from "@/lib/access";

/**
 * Every page in the nav and the area it belongs to. Items outside the
 * signed-in user's areas are left out; the pages 404 for them anyway.
 */
export const NAV_ITEMS: {
  title: string;
  url: string;
  icon: Icon;
  area: Area | null;
}[] = [
  { title: "Home", url: "/", icon: IconHome, area: null },
  {
    title: "Publish rankings",
    url: "/rankings",
    icon: IconTrophy,
    area: "admin",
  },
  { title: "Ballots", url: "/ballots", icon: IconChecklist, area: "ballots" },
  { title: "Voting panels", url: "/voters", icon: IconUsers, area: "admin" },
  { title: "Polls", url: "/polls", icon: IconListDetails, area: "admin" },
  {
    title: "Transfer portal",
    url: "/portal",
    icon: IconTransfer,
    area: "portal",
  },
  {
    title: "Ratings & SOS",
    url: "/ratings",
    icon: IconChartBar,
    area: "admin",
  },
  { title: "School IDs", url: "/school-ids", icon: IconId, area: "admin" },
  {
    title: "Playoff brackets",
    url: "/brackets",
    icon: IconBinaryTree,
    area: "admin",
  },
  { title: "Staff", url: "/staff", icon: IconUserShield, area: "admin" },
  {
    title: "Development",
    url: "/development",
    icon: IconDatabase,
    area: "admin",
  },
];

/** The nav for someone with these areas. Home is everyone's. */
export function navItemsFor(areas: readonly Area[]) {
  return NAV_ITEMS.filter((item) => !item.area || areas.includes(item.area));
}

export function AppSidebar({
  areas,
  ...props
}: React.ComponentProps<typeof Sidebar> & { areas: Area[] }) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/" prefetch={false} />}
            >
              {/*<IconInnerShadowTop className="!size-5" />*/}
              <Image
                src="https://cdn.sanity.io/images/8pbt9f8w/production/6ed24cde242b41912e2d06bf2ca7da9abdf97c06-4347x2855.svg"
                className="size-8"
                alt="Redshirt Sports Logo"
                unoptimized={true}
                width={25.6}
                height={25.6}
              />
              <span className="text-base font-semibold">Redshirt Sports</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItemsFor(areas)} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
