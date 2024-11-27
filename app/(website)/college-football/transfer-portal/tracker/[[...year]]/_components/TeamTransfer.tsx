import Image from 'next/image'
import { ArrowRightIcon } from 'lucide-react'

import { Image as SanityImage } from '@/components/image'

interface TeamTransferProps {
  previousTeam: {
    name: string
    logo: string
  }
  newTeam: {
    name?: string
    logo?: string
  }
}

export function TeamTransfer({ previousTeam, newTeam }: TeamTransferProps) {
  return (
    <div className="mt-4 flex items-center justify-center space-x-4 md:ml-4 md:mt-0 md:justify-end">
      {/* <Image
        src={previousTeam.logo}
        alt={previousTeam.name}
        width={40}
        height={40}
        unoptimized
        className="size-10"
      /> */}
      <SanityImage src={previousTeam.image} width={40} height={40} alt={previousTeam.name} />
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
