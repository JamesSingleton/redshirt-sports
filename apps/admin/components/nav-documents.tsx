"use client";

import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@redshirt-sports/ui/components/menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@redshirt-sports/ui/components/sidebar";
import {
  type Icon,
  IconDots,
  IconFolder,
  IconShare3,
  IconTrash,
} from "@tabler/icons-react";

export function NavDocuments({
  items,
}: {
  items: {
    name: string;
    url: string;
    icon: Icon;
  }[];
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Documents</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton render={<a href={item.url} />}>
              <item.icon />
              <span>{item.name}</span>
            </SidebarMenuButton>
            <Menu>
              <MenuTrigger
                render={
                  <SidebarMenuAction
                    showOnHover
                    className="data-open:bg-accent rounded-sm"
                  />
                }
              >
                <IconDots />
                <span className="sr-only">More</span>
              </MenuTrigger>
              <MenuContent
                className="w-24 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <MenuItem>
                  <IconFolder />
                  <span>Open</span>
                </MenuItem>
                <MenuItem>
                  <IconShare3 />
                  <span>Share</span>
                </MenuItem>
                <MenuSeparator />
                <MenuItem>
                  <IconTrash />
                  <span>Delete</span>
                </MenuItem>
              </MenuContent>
            </Menu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <IconDots className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
