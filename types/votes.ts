import { type ImageAsset } from 'sanity'

export type VoteWithExtraData = {
  name: string
  shortName: string
  abbreviation: string
  image: { caption: string; asset: ImageAsset; _type: string }
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
  ballot: VoteWithExtraData[]
}
