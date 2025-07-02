import { groq } from 'next-sanity'

export const schoolsByIdOrderedByPoints = groq`
*[_type == "school" && _id in $ids[].id]{
  _id,
  "_points": $ids[id == ^._id][0].totalPoints,
  name,
  shortName,
  abbreviation,
  image,
} | order(_points desc)
`

export const schoolWithVoteOrder = groq`
*[_type == "school" && _id in $ids[].teamId]{
  _id,
  "_order": $ids[teamId == ^._id][0].rank,
  name,
  shortName,
  abbreviation,
  image,
} | order(_order)
`
