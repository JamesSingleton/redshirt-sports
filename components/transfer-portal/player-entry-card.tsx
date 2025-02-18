import Image from 'next/image'
import { CheckIcon, LogInIcon, LogOutIcon, GraduationCap, ArrowRightIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Badge, badgeVariants } from '@/components/ui/badge'
import { Image as SanityImage } from '@/components/image'
import { UndecidedTransferIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

const statusIcons: { [key: string] } = {
  Entered: <LogInIcon className="h-4 w-4" />,
  Committed: <CheckIcon className="h-4 w-4" />,
  Withdrawn: <LogOutIcon className="h-4 w-4" />,
}

export function PlayerEntryCard() {
  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-4">
          <Image
            src="https://on3static.com/cdn-cgi/image/height=90,width=90/uploads/assets/633/336/336633.png"
            alt="Transfer Portal Player"
            className="size-20 rounded-full object-cover object-top"
            width={80}
            height={80}
            unoptimized
          />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center space-x-2">
              <time
                className={cn(badgeVariants({ variant: 'outline' }), 'shrink-0')}
                dateTime="2025-01-17"
              >
                {/* {new Date(entryDate).toLocaleDateString()} */}
                1/17/2025
              </time>
              <Badge className="shrink-0">
                {/* {statusIcons[transferStatus as keyof typeof statusIcons]} */}
                {statusIcons['Entered']}
                <span className="ml-1">Entered</span>
              </Badge>
            </div>
            <div className="mb-1 flex items-center space-x-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-brand-500 text-xs font-medium text-white">
                WR
              </div>
              <h2 className="inline-flex items-center text-lg font-semibold">
                {/* {entry.firstName} {entry.lastName} */}
                Isaiah Garcia-Castaneda
                {/* {isGradTransfer && (
                  <GraduationCap className="ml-2 h-5 w-5" aria-label="Graduate Transfer" />
                )} */}
                <GraduationCap className="ml-2 h-5 w-5" aria-label="Graduate Transfer" />
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {/* {entry.classYearAbbreviation} | {`${feet}'${inches}"`} | {entry.weight} */}
              RS-SR | 6'0" | 220
            </p>
            <p className="text-sm text-muted-foreground">
              {/* {`${entry.highSchool} (${entry.hometown}, ${entry.state})`} */}
              Twentynine Palms (Mission Viejo, CA)
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center space-x-4 md:ml-4 md:mt-0 md:justify-end">
          <SanityImage
            className="size-10"
            src={{
              _type: 'image',
              asset: {
                _ref: 'image-c0f483c400c8a39ef87c4be673fb38627d1debb3-150x150-png',
                _type: 'reference',
              },
              caption: 'University of Nebraska–Lincoln Logo',
            }}
            alt="Previous School Logo"
            width={40}
            height={40}
          />
          <ArrowRightIcon className="size-6 text-muted-foreground" />
          <SanityImage
            className="size-12"
            src={{
              _type: 'image',
              asset: {
                _ref: 'image-a3607f0bc6befdd406fdeb9458f883f2e490bddb-150x150-webp',
                _type: 'reference',
              },
              caption: 'South Dakota State University logo',
            }}
            alt="Commitment School Logo"
            width={48}
            height={48}
          />
        </div>
      </div>
    </Card>
  )
}
