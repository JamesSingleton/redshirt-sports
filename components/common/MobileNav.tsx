'use client'

import { Fragment, useState } from 'react'
import Link, { LinkProps } from 'next/link'
import { useRouter } from 'next/navigation'
import { SidebarOpen } from 'lucide-react'

import { cn } from '@lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@components/ui/Sheet'
import { Button } from '@components/ui/Button'
import { ScrollArea } from '@components/ui/ScrollArea'
import { STATIC_NAV_ITEMS } from '@lib/constants'
import RedRSLogo from '@components/common/SmallLogo'

export function MobileNav(props: any) {
  const [open, setOpen] = useState(false)

  const { categories } = props

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <SidebarOpen className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent size="xl" position="left" className="pr-0">
        <MobileLink href="/" className="flex items-center" onOpenChange={setOpen}>
          <RedRSLogo className="mr-2 h-8 w-8" />
          <span className="font-bold">Redshirt Sports</span>
        </MobileLink>
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="flex flex-col space-y-2">
            {categories.map((item: any, index: number) => (
              <div key={index} className="flex flex-col space-y-3 pt-6">
                <h4 className="text-xl font-semibold">{item.title}</h4>
                {item?.subcategories?.length > 0 &&
                  item.subcategories.map((item: any) => (
                    <Fragment key={item.href}>
                      <MobileLink
                        href={`/news/${item.parentSlug}/${item.slug}`}
                        onOpenChange={setOpen}
                      >
                        {item.title}
                      </MobileLink>
                    </Fragment>
                  ))}
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-col space-y-3">
            {STATIC_NAV_ITEMS.map(
              (item) =>
                item.href && (
                  <MobileLink key={item.href} href={item.href} onOpenChange={setOpen}>
                    {item.title}
                  </MobileLink>
                )
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

interface MobileLinkProps extends LinkProps {
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

function MobileLink({ href, onOpenChange, className, children, ...props }: MobileLinkProps) {
  const router = useRouter()
  return (
    <Link
      href={href}
      onClick={() => {
        router.push(href.toString())
        onOpenChange?.(false)
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </Link>
  )
}
