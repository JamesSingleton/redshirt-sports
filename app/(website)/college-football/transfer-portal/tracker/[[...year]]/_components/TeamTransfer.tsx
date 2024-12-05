import { ArrowRightIcon } from 'lucide-react'

import { Image as SanityImage } from '@/components/image'
import { TransferSchool } from '@/types'

interface TeamTransferProps {
  previousSchool: TransferSchool
  commitmentSchool: TransferSchool
}

export function TeamTransfer({ previousSchool, commitmentSchool }: TeamTransferProps) {
  console.log(previousSchool.conference)
  console.log(previousSchool.division)
  console.log(previousSchool.image)
  return (
    <div className="mt-4 flex items-center justify-center space-x-4 md:ml-4 md:mt-0 md:justify-end">
      <SanityImage
        src={previousSchool.image}
        width={40}
        height={40}
        className="size-10"
        alt={previousSchool.name}
      />
      <ArrowRightIcon className="size-6 text-muted-foreground" />
      {commitmentSchool && commitmentSchool.image && commitmentSchool.name ? (
        <SanityImage
          src={commitmentSchool.image}
          alt={commitmentSchool.name}
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
