import Image from 'next/image'
import { ArrowRightIcon } from 'lucide-react'

import { Image as SanityImage } from '@/components/image'

interface TeamTransferProps {
  previousTeam: {
    name: string
    image: {
      _key?: string | null
      _type?: 'image' | string
      asset: {
        _type: 'reference'
        _ref: string
        metadata: {
          lqip?: string
        }
      }
      crop: {
        top: number
        bottom: number
        left: number
        right: number
      } | null
      hotspot: {
        x: number
        y: number
        height: number
        width: number
      } | null
      caption?: string | undefined
    }
  }
  newTeam?: {
    name?: string
    image?: string
  }
}

export function TeamTransfer({ previousTeam, newTeam }: TeamTransferProps) {
  return (
    <div className="mt-4 flex items-center justify-center space-x-4 md:ml-4 md:mt-0 md:justify-end">
      <SanityImage
        src={previousTeam.image}
        width={40}
        height={40}
        className="size-10"
        alt={previousTeam.name}
      />
      <ArrowRightIcon className="size-6 text-muted-foreground" />
      {newTeam && newTeam.image && newTeam.name ? (
        <Image
          src={newTeam.image}
          alt={newTeam.name}
          width={40}
          height={40}
          unoptimized
          className="size-10"
        />
      ) : (
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <span className="text-sm">?</span>
        </div>
      )}
    </div>
  )
}
