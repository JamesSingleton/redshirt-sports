'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, User, ClipboardList, FlipHorizontal, HomeIcon } from 'lucide-react'

import { cn } from '@lib/utils'

const navigation = [
  { name: 'Home', href: '/admin', icon: HomeIcon },
  { name: 'Recruitment', href: '/admin/recruitment', icon: User },
  { name: 'Transfer Portal', href: '/admin/transfer-portal', icon: FlipHorizontal },
]

const SideNav = () => {
  const pathname = usePathname()

  return (
    <aside className="w-64 overflow-auto border-r border-zinc-200 dark:border-zinc-800">
      <nav className="flex flex-col gap-4 p-4">
        <ul>
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      pathname === item.href
                        ? ' bg-secondary text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-primary',
                      'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                    )}
                  >
                    <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

export default SideNav
