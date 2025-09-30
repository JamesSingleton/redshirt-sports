'use client'

import { IconCirclePlusFilled, IconMail, type Icon } from '@tabler/icons-react'

import { Button } from '@redshirt-sports/ui/components/button'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@redshirt-sports/ui/components/sidebar'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const currentPath = usePathname()
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} isActive={item?.url === currentPath}>
                {item.icon && <item.icon />}
                {item.url ? <Link href={item.url}>{item.title}</Link> : <span>{item.title}</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
