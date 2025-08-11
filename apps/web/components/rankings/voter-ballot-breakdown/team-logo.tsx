'use client'

import * as React from 'react'

import CustomImage from '../../sanity-image'

type Vote = {
  _id: string
  image?: string
  teamName?: string
}

function TeamLogoBase({ vote, size = 40 }: { vote: Vote; size?: number }) {
  return (
    <CustomImage
      image={vote.image}
      width={size}
      height={size}
      loading="lazy"
      className="size-10 shrink-0 rounded-sm object-contain"
    />
  )
}

export const TeamLogo = React.memo(
  TeamLogoBase,
  (prev, next) =>
    prev.size === next.size &&
    prev.vote?._id === next.vote?._id &&
    prev.vote?.image === next.vote?.image &&
    prev.vote?.teamName === next.vote?.teamName,
)
