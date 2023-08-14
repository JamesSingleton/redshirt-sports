'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DialogProps } from '@radix-ui/react-alert-dialog'
import { Link2, File, Laptop, Moon, SunMedium } from 'lucide-react'
import { useTheme } from 'next-themes'

import { cn } from '@lib/utils'
import { Button } from '@components/ui/Button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@components/ui/Command'
import { STATIC_NAV_ITEMS } from '@lib/constants'

export function CommandMenu({ ...props }: DialogProps & { divisions: any[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { setTheme } = useTheme()
  const { divisions } = props

  // get just the title and slug of categories
  const topLevelCategories = divisions.map((division) => ({
    title: division.name,
    href: `/news/${division.slug}`,
  }))

  const links = [...topLevelCategories, ...STATIC_NAV_ITEMS]

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          'relative h-9 w-full justify-start rounded-[0.5rem] text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64',
        )}
        onClick={() => setOpen(true)}
        {...props}
      >
        <span className="hidden lg:inline-flex">Search Redshirt Sports...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Links">
            {links.map((navItem) => (
              <CommandItem
                key={navItem.href}
                value={navItem.title}
                onSelect={() => {
                  runCommand(() => router.push(navItem.href as string))
                }}
              >
                <Link2 className="mr-2 h-4 w-4" />
                {navItem.title}
              </CommandItem>
            ))}
            <CommandItem
              value="Privacy Policy"
              onSelect={() => {
                runCommand(() => router.push('/privacy'))
              }}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Privacy Policy
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          {divisions.map(
            (group) =>
              group.conferences.length > 0 && (
                <CommandGroup key={group.name} heading={group.name}>
                  {group.conferences.map((navItem: any) => (
                    <CommandItem
                      key={navItem.slug}
                      value={navItem.name}
                      onSelect={() => {
                        runCommand(() => router.push(`/news/${group.slug}/${navItem.slug}`))
                      }}
                    >
                      <div className="mr-2 flex h-4 w-4 items-center justify-center">
                        <File className="h-3 w-3" />
                      </div>
                      {navItem.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ),
          )}
          <CommandSeparator />
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <SunMedium className="mr-2 h-4 w-4" />
              Light
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Laptop className="mr-2 h-4 w-4" />
              System
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
