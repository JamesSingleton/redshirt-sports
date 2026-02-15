'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@redshirt-sports/ui/lib/utils'

const navItems = [
  { label: 'News', href: '/transfer-portal/news' },
  { label: 'NCAA Transfer Portal', href: '/transfer-portal' },
  { label: 'Player Rankings', href: '/transfer-portal/player-rankings' },
  { label: 'Team Rankings', href: '/transfer-portal/team-rankings' },
]

export function TransferPortalHeader() {
  const pathname = usePathname()

  return (
    <div className="border-b border-border bg-card">
      <div className="container">
        <div className="flex items-center gap-8 overflow-x-auto py-3">
          <Link
            href="/transfer-portal"
            className="flex-shrink-0 text-base font-extrabold uppercase tracking-widest text-primary"
          >
            Transfer Portal
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
