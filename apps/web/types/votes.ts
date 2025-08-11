import type { SanityImageAsset } from '@/lib/sanity/sanity.types'

export type VoteWithExtraData = {
  name: string
  shortName: string
  abbreviation: string
  image: SanityImageAsset
  _id: string
  _order: number
}

export type VoterData = {
  id: string
  firstName: string
  lastName: string
  organization: string
  organizationRole: string
}

export type BallotAndVoterData = {
  votes: VoteWithExtraData[]
  userData: VoterData
}

export type BallotsByVoter = {
  [key: string]: BallotAndVoterData
}

export type VoterBreakdown = {
  name: string
  organization: string
  organizationRole: string
  ballot: VoteWithExtraData[]
}

export type Vote = {
  _id: string
  image?: string
  teamName?: string
}

export type Voter = {
  name: string
  organization: string
  organizationRole?: string
  ballot: Vote[] // expected length 25
}
