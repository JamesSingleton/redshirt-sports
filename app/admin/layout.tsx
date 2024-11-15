import Link from 'next/link'
import { Menu, Vote, Database, LayoutDashboard } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'

import { ThemeProvider } from '@/components/theme-provider'
import SmallLogo from '@/components/small-logo'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
