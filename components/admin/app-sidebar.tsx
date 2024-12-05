import * as React from 'react'
import { currentUser, auth } from '@clerk/nextjs/server'

import { NavMain } from '@/components/admin/nav-main'
import { NavUser } from '@/components/admin/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import SmallLogo from '@/components/small-logo'
import Link from 'next/link'
import { url } from 'inspector'

// This is sample data.
const data = {
  navMain: [
    {
      title: 'Transfer Portal',
      url: '/admin/transfer-portal',
      items: [
        {
          title: 'Overview',
          url: '/admin/transfer-portal',
        },
        {
          title: 'Add Player',
          url: '/admin/transfer-portal/add',
        },
        {
          title: 'Edit Player',
          url: '/admin/transfer-portal/edit',
        },
      ],
    },
    {
      title: 'Top 25 Voting',
      url: '/admin/top-25-voting',
      items: [
        {
          title: 'Overview',
          url: '/admin/top-25-voting',
        },
        {
          title: 'Voters',
          url: '/admin/top-25-voting/voters',
          isActive: true,
        },
        {
          title: 'FCS Top 25',
          url: '/admin/top-25-voting/fcs',
        },
        {
          title: 'FBS Top 25',
          url: '/admin/top-25-voting/fbs',
        },
        {
          title: 'DII Top 25',
          url: '/admin/top-25-voting/d2',
        },
        {
          title: 'DIII Top 25',
          url: '/admin/top-25-voting/d3',
        },
      ],
    },
  ],
}

export async function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = await currentUser()
  const { firstName, lastName } = user!

  const adminUser = {
    name: `${firstName} ${lastName}`,
    email: user?.emailAddresses[0].emailAddress!,
    avatar: user?.imageUrl!,
  }
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin/home">
                <div className="aspect-square flex size-8 items-center justify-center rounded-lg bg-white text-sidebar-primary-foreground">
                  <SmallLogo className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Redshirt Sports</span>
                  <span>Portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={adminUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
