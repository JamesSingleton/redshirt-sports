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
  IconArrowsExchange,
  IconDeviceLaptop,
  IconHelp,
  IconHome,
  IconSearch,
  IconSettings,
  IconTrophy,
  IconUserCheck,
  IconUsers,
} from "@tabler/icons-react";
import Image from "next/image";
import type * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconHome,
    },
    {
      title: "Rankings",
      url: "/rankings",
      icon: IconTrophy,
    },
    {
      title: "Voters",
      url: "/voters",
      icon: IconUserCheck,
    },
    {
      title: "Players",
      url: "/players",
      icon: IconUsers,
    },
    {
      title: "Transfer Portal",
      url: "/transfer-portal",
      icon: IconArrowsExchange,
    },
    {
      title: "Development",
      url: "/development",
      icon: IconDeviceLaptop,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<a href="/" />}
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
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
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
