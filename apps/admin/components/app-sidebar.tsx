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
  IconDatabase,
  IconHome,
  IconListDetails,
  IconTrophy,
  IconUsers,
} from "@tabler/icons-react";
import Image from "next/image";
import type * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";

const data = {
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: IconHome,
    },
    {
      title: "Publish rankings",
      url: "/rankings",
      icon: IconTrophy,
    },
    {
      title: "Voting panels",
      url: "/voters",
      icon: IconUsers,
    },
    {
      title: "Polls",
      url: "/polls",
      icon: IconListDetails,
    },
    {
      title: "Development",
      url: "/development",
      icon: IconDatabase,
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
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/">
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
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
