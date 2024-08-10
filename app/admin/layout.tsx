import Link from 'next/link'
import { Menu, Vote, Database, LayoutDashboard } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'

import { ThemeProvider } from '@/components/common/ThemeProvider'
import SmallLogo from '@/components/common/SmallLogo'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link href="/admin/home" className="flex items-center gap-2 font-semibold">
                <SmallLogo className="h-8 w-8" />
                <span className="sr-only">{process.env.NEXT_PUBLIC_APP_NAME}</span>
              </Link>
            </div>
            <div className="flex-1">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                <Link
                  href="/admin/home"
                  className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/admin/vote"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <Vote className="h-4 w-4" />
                  Top 25 Vote
                </Link>
                <Link
                  href="/admin/transfer-portal"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                >
                  <Database className="h-4 w-4" />
                  Transfer Portal
                </Link>
              </nav>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <nav className="grid gap-2 text-lg font-medium">
                  <Link
                    href="/admin/home"
                    className="flex items-center gap-2 text-lg font-semibold"
                  >
                    <SmallLogo className="h-8 w-8" />
                    <span className="sr-only">{process.env.NEXT_PUBLIC_APP_NAME}</span>
                  </Link>
                  <Link
                    href="/admin/home"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/vote"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl bg-muted px-3 py-2 text-foreground hover:text-foreground"
                  >
                    <Vote className="h-5 w-5" />
                    Top 25 Vote
                  </Link>
                  <Link
                    href="/admin/transfer-portal"
                    className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                  >
                    <Database className="h-5 w-5" />
                    Transfer Portal
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
            <div className="ml-auto flex items-center">
              <UserButton />
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  )
}
