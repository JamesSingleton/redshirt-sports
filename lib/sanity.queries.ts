import { groq } from 'next-sanity'

import { perPage } from './constants'

const legalFields = `
  _id,
  _updatedAt,
  title,
  slug,
  body
`

const authorFields = `
  _id,
  _updatedAt,
  name,
  'slug': slug.current,
  role,
  image,
  bio,
  socialMedia
`

export const allAuthors = groq`
*[_type == 'author' && archived != true] | score(
  boost(role == 'Staff Writer', 4),
  boost(role == 'Content Writer', 3),
  boost(role == 'Contributor', 2),
  boost(role == 'Freelancer', 1),
) | order(_score desc, name asc){
  ${authorFields}
}
`

export const privacyPolicy = groq`
*[_type == "legal" && slug.current == "privacy-policy"][0] {
  ${legalFields}
}
`

const postFields = `
  _id,
  _updatedAt,
  title,
  publishedAt,
  "mainImage": {
    "caption": mainImage.caption,
    "attribution": mainImage.attribution,
    "crop": mainImage.crop,
    "hotspot": mainImage.hotspot,
    "asset": mainImage.asset->
  },
  division->{
    name,
    "slug": slug.current,
  },
  conferences[]->{
    name,
    shortName,
    "slug": slug.current,
  },
  "slug": slug.current,
  "author": author->{name, 'slug': slug.current, bio, role, socialMedia, image, archived},
  excerpt,
  body[]{
    ...,
    markDefs[]{
      ...,
      _type == "internalLink" => {
        reference->{
          _type,
          "slug": slug.current,
          "divisionSlug": division->slug.current,
        }
      },
    },
    _type == 'top25Table' => {
      ...,
      votes[]{
        ...,
        teams[]->{
          _id,
          name,
          abbreviation,
          image
        }
      }
    }
  },
  featuredArticle,
  "estimatedReadingTime": round(length(pt::text(body)) / 5 / 180 ),
  "wordCount": length(pt::text(body))
`

const litePostFields = `
  _id,
  title,
  publishedAt,
  "mainImage": {
    "caption": mainImage.caption,
    "attribution": mainImage.attribution,
    "crop": mainImage.crop,
    "hotspot": mainImage.hotspot,
    "asset": mainImage.asset->{
      _id,
      _type,
      url,
      metadata
    },
  },
  division->{
    name,
    "slug": slug.current,
    longName
  },
  conferences[]->{
    _id,
    name,
    shortName,
    "slug": slug.current,
  },
  "estimatedReadingTime": round(length(pt::text(body)) / 5 / 180 ),
  "slug": slug.current,
  "author": author->{name, 'slug': slug.current, archived, "image": { "asset": image.asset->{_id, _type, metadata, url}}},
  excerpt,
`

export const heroPostsQuery = groq`
*[_type == "post" && featuredArticle != true] | order(publishedAt desc)[0...3] {
  ${litePostFields}
}
`

export const latestArticlesForHomePageQuery = groq`
*[_type == "post" && featuredArticle != true] | order(publishedAt desc, _updatedAt desc)[3..6] {
  ${litePostFields}
}
`

export const postsBySlugQuery = groq`
*[_type == "post" && slug.current == $slug][0]{
  ${postFields},
  "relatedArticles": *[
    _type == "post"
    && _id != ^._id
    && (count(conferences[@._ref in ^.^.conferences[]._ref]) > 0 || count(tags[@._ref in ^.^.tags[]._ref]) > 0)
  ] | order(publishedAt desc, _createdAt desc) {
      _id,
      title,
      publishedAt,
      mainImage,
      division->{
        name,
      },
      conferences[]->{
        shortName
      },
      "slug": slug.current,
      "author": author->{name},
  }[0...3]
}
`

export const latestDivisionArticlesQuery = groq`
*[_type == "post" && division->name == $division && !(_id in $ids)] | order(publishedAt desc, _updatedAt desc)[0...5] {
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  mainImage,
  division->{
    name,
    "slug": slug.current,
  },
  conferences[]->{
    name,
    shortName,
    "slug": slug.current,
  },
  "author": author->{name, image, 'slug': slug.current},
}
`

export const heroArticleQuery = groq`
*[_type == "post" && featuredArticle != true] | order(publishedAt desc) [0] {
  ${litePostFields}
}`

export const recentArticlesQuery = groq`
*[_type == "post" && featuredArticle != true] | order(publishedAt desc, _updatedAt desc)[1..2] {
  ${litePostFields}
}
`

export const featuredArticlesQuery = groq`
*[_type == "post" && featuredArticle == true] | order(publishedAt desc, _updatedAt desc)[0..3] {
  ${litePostFields}
}
`

export const otherArticlesQuery = groq`
*[_type == "post" && featuredArticle != true] | order(publishedAt desc, _updatedAt desc)[3..6] {
  ${litePostFields}
}
`

export const authorBySlug = groq`
  *[_type == 'author' && slug.current == $slug && archived == false][0]{
    ${authorFields}
  }
`

export const conferencesAuthorHasWrittenFor = groq`
*[_id == $authorId][0] {
  "conferences": array::unique(*[_id in *[_type == "post" && references($authorId)].conferences[]._ref])[] {
    _id,
    name,
    shortName,
    "division": division->.name
  } | order(name asc)
}
`

export const authorsPosts = groq`
*[_id == $authorId][0]{
  "posts": *[_type == 'post' && references(^._id) && select(
    $conference == null => true,
    $conference in conferences[]->name
  )] | order(publishedAt desc, _updatedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
    ${litePostFields}
  },
  "totalPosts": count(*[_type == 'post' && references(^._id) && select(
    $conference == null => true,
    $conference in conferences[]->name
  )])
}
`

export const postPaths = `
*[_type == "post" && defined(slug.current) && dateTime(publishedAt) > dateTime(now()) - $lasts30DaysInSeconds][].slug.current
`

export const divisionPaths = `
*[_type == "division" && defined(slug.current)][].slug.current
`

// create a query that returns the conference slugs concatenated with the division slug where there's at least 1 article that references that conference
export const conferencePaths = groq`
*[_type == "conference" && defined(slug.current) && defined(division) && count(*[_type == 'post' && references(^._id)]) > 0]{
  "slug": slug.current,
  "divisionSlug": division->slug.current,
}
`

export const authorsForSiteMapQuery = groq`
*[_type == 'author' && defined(slug.current) && archived == false]{
  _updatedAt,
  "slug": slug.current,
}
`

export const transferPortalPlayers = groq`
  *[_type == 'transferPortal']{
    ...,
    "player": player->{
      ...
    },
    "transferringFrom": transferringFrom->{
      ...
    },
    "transferringTo": transferringTo->{
      ...
    },
  }
`

export const divisionsQuery = groq`
*[_type == "division" && count(*[_type == 'post' && references(^._id)]) > 0]{
  ...,
  "slug": slug.current,
  "conferences": *[_type == "conference" && division._ref == ^._id && count(*[_type == 'post' && references(^._id)]) > 0]{
    ...,
    "slug": slug.current,
  } | order(name asc)
} | order(name desc)
`

export const divisionBySlugQuery = groq`
*[_type == "division" && slug.current == $slug][0]{
  ...,
  "slug": slug.current,
  "posts": *[_type == "post" && references(^._id)] | order(publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
    ${litePostFields}
  },
  "totalPosts": count(*[_type == "post" && references(^._id)])
}
`

export const conferenceBySlugQuery = groq`
*[_type == "conference" && slug.current == $slug][0]{
  ...,
  "slug": slug.current,
  "division": division-> {
    name,
    "slug": slug.current,
  },
  "posts": *[_type == "post" && references(^._id)] | order(publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
    ${litePostFields}
  },
  "totalPosts": count(*[_type == "post" && references(^._id)])
}
`

export const paginatedPostsQuery = groq`
  {
    "posts": *[_type == "post"] | order(publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
      _id,
      title,
      publishedAt,
      mainImage,
      division->{
        name,
      },
      conferences[]->{
        shortName
      },
      "slug": slug.current,
      "author": author->{name},
    },
    "totalPosts": count(*[_type == "post"])
  }
`

export const searchQuery = groq`
{
  "posts": *[_type == 'post' && (title match "*" + $q + "*" || excerpt match "*" + $q + "*" || pt::text(body) match "*" + $q + "*")] | score(
    boost(title match $q, 4),
    boost(excerpt match $q, 3),
    boost(pt::text(body) match $q, 2),
  ) | order(_score desc, publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}]{
    ${litePostFields}
  },
  "totalPosts": count(*[_type == 'post' && (title match "*" + $q + "*" || excerpt match "*" + $q + "*" || pt::text(body) match "*" + $q + "*")])
}
`

export const openGraphDataBySlug = groq`
*[_type == "post" && slug.current == $slug][0]{
  "title": title,
  mainImage,
  "author": author->{name, role, image},
  "publishedAt": publishedAt,
}
`

export const schoolsByDivision = groq`
*[_type == "school" && division->slug.current == $division]| order(shortName asc){
  _id,
  name,
  shortName,
  abbreviation,
  image,
  conference->{
    name,
    shortName
  }
}
`

export const schoolsByIdOrderedByRank = groq`
*[_type == "school" && _id in $ids[].id]{
  _id,
  "_order": $ids[id == ^._id][0].rank,
  name,
  shortName,
  abbreviation,
  image,
} | order(_order)
`

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

export const lastThreePosts = groq`
*[_type == "post"] | order(publishedAt desc)[0...3]{
  _id,
  title,
  publishedAt,
  "slug": slug.current,
  "author": author->{name},
  excerpt,
}
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
